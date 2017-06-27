"use strict";

const OutputDevice = require("../output-device.js");
const deviceInfo   = require("./device-info.js");
const charnames    = require("../charnames.js");

module.exports = function(context, tokens, opts = {}){
	const {zoom = 1, device = deviceInfo} = opts;
	
	const marks    = [];
	const devCmds  = [];
	let charHeight = 0;
	let charSize   = 0;
	let colour     = "#000";
	let drawColour = "#000";
	let font       = ["", "px sans-serif"];
	let invisible  = false;
	let lineWidth  = 1;
	let mark       = null;
	let markWrap   = false;
	let rotated    = false;
	let slant      = 0;
	let sourceFile = "";
	let tm         = null;
	let x          = 0;
	let y          = 0;
	
	const markStart = args =>
		mark = parseMark(args, x, y, scale);
	
	const markEnd = () => {
		if(null !== mark){
			mark.width = (x - mark.x) + mark.lead;
			marks.push(mark);
			mark.draw(context);
			mark = null;
		}
	};
	
	const text = s => {
		context.save();
		if(null !== tm){
			context.translate(x, y);
			context.transform(...tm);
			context.translate(-x, -y);
		}
		context.fillText(s, x, y);
		context.restore();
		if(true === markWrap){
			const lastMark = marks[marks.length - 1];
			lastMark && markStart(lastMark.args);
			markWrap = false;
		}
	};
	
	const updateTransformMatrix = () => {
		if(0 === slant && 0 === charHeight)
			tm = null;
		else{
			tm = [1,0,0,1,0,0];
			if(0 !== charHeight)
				tm[3] = charHeight / charSize;
			if(0 !== slant){
				let angle = -slant;
				if(0 !== charHeight)
					angle *= charHeight / charSize;
				angle = angle * Math.PI / 180;
				tm[2] = Math.sin(angle) / Math.cos(angle);
			}
		}
	};
	
	const mountFont = name => {
		if(!name) return name;
		const fontData = device.fonts[name];
		const family = fontData[0];
		const style = fontData.slice(1).reverse().join(" ");
		return [style ? style + " " : "", `px ${family}`];
	};
	
	// Resolve device properties
	const sizeScale  = device.sizeScale || 1;
	const scale      = sizeScale / window.devicePixelRatio / zoom;
	const res        = [device.res, device.hor, device.vert];
	const fonts      = [...device.mountedFonts || []].map(mountFont);
	
	context.lineCap  = "round";
	context.lineJoin = "round";
	context.moveTo(x, y);
	const {length} = tokens;
	for(let i = 0; i < length; ++i){
		const token = tokens[i];
		const type  = token[0];
		
		if(type === tokenTypes.COMMENT || invisible && type !== tokenTypes.DEVICE_CTRL)
			continue;
		
		const data = token.slice(1).join("").trim();
		switch(type){
			case tokenTypes.DEVICE_CTRL: {
				const [ctrl, ...args] = data.split(/\s+/);
				
				switch(ctrl[0]){
					// Source filename
					case "F":
						sourceFile = args.join(" ");
						break;
					
					// Mount font
					case "f":
						fonts[args[0]] = mountFont(args[1]);
						break;
					
					// Character height
					case "H":
						charHeight = +args[0] / scale;
						if(charSize === charHeight)
							charHeight = 0;
						updateTransformMatrix();
						break;
					
					// Output resolution
					case "r":
						res[0] = +args[0] || 0;
						res[1] = +args[1] || 0;
						res[2] = +args[2] || 0;
						break;
					
					// Slant
					case "S":
						slant = +args[0] || 0;
						updateTransformMatrix();
						break;
					
					// Device-specific
					case "X":{
						const line = data.replace(/^\s*X\S*\s*|\n\+/g, "");
						const args = line.split(/\s+/);
						const lastArg = args[args.length - 1];
						
						switch(args[0].toLowerCase()){
							// PostScript commands
							case "ps:":
							case "ps:exec":
								switch(args[1]){
									
									// Suppress output
									case "invis":
										invisible = true;
										break;
									
									// Stop suppressing output
									case "endinvis":
										invisible = false;
										break;
									
									// Execute PostScript code
									default:
										// Set rotation
										if(/exec gsave currentpoint 2 copy translate .+ rotate neg exch neg exch translate/.test(line)){
											context.save();
											context.resetTransform();
											context.translate(x, y);
											context.rotate((+args[7] || 0) * Math.PI / 180);
											context.translate(-x, -y);
											rotated = true;
										}
										
										// Unset rotation
										else if(/exec grestore/.test(line)){
											context.restore();
											rotated = false;
										}
										
										// Set stroke properties
										else if(/exec \d setline(cap|join)/.test(line))
											"cap" === RegExp.lastParen
												? (context.lineCap  = ["butt", "round", "square"][args[2]])
												: (context.lineJoin = ["miter", "round", "bevel"][args[2]]);
										
										// Unknown/non-graphical command
										else devCmds.push({x, y, line});
										break;
								}
								break;
							
							// PDF-specific feature
							case "pdf:":
								switch(args[1]){
									case "markstart": markStart(args); break;
									case "markend":   markEnd();       break;
									default:          devCmds.push({x, y, line});
								}
						}
						break;
					}
				}
				break;
			}
			
			case tokenTypes.CHAR_INDEXED:
				text(String.fromCharCode(+data));
				break;
			
			case tokenTypes.CHAR_LITERAL:
				text(data);
				break;
			
			case tokenTypes.CHAR_NAMED:
				text(charnames[data]);
				break;
			
			case tokenTypes.DRAWING:{
				const [type, ...args] = data.split(/\s+/);
				const fill = () => {
					context.fillColor = drawColour;
					context.fill();
					context.fillColor = colour;
				};
				
				switch(type){
					
					// B-spline
					case "~":{
						context.beginPath();
						context.moveTo(x, y);
						context.lineTo(
							x += (args[0] / 2) / scale,
							y += (args[1] / 2) / scale
						);
						const tNum = 2;
						const tDen = 3;
						const numPoints = args.length - 2;
						for(let i = 0; i < numPoints; i += 2){
							const nX = ((args[i]   - args[i]   / 2) + args[i+2] / 2) / scale;
							const nY = ((args[i+1] - args[i+1] / 2) + args[i+3] / 2) / scale;
							context.bezierCurveTo(
								x + ((args[i]   * tNum) / (2 * tDen)) / scale,
								y + ((args[i+1] * tNum) / (2 * tDen)) / scale,
								x + (args[i]   / 2 + (args[i+2] * (tDen - tNum)) / (2 * tDen)) / scale,
								y + (args[i+1] / 2 + (args[i+3] * (tDen - tNum)) / (2 * tDen)) / scale,
								x + nX,
								y + nY
							);
							x += nX;
							y += nY;
						}
						x += (args[numPoints]     - args[numPoints]     / 2) / scale;
						y += (args[numPoints + 1] - args[numPoints + 1] / 2) / scale;
						context.lineTo(x, y);
						context.stroke();
						break;
					}
					
					// Arc
					case "a":{
						const h0 = x * scale;
						const v0 = y * scale;
						const h1 = +args[0];
						const v1 = +args[1];
						const h2 = +args[2];
						const v2 = +args[3];
						drawArc(context, scale, h0, v0, h1, v1, h2, v2);
						x += (h1 + h2) / scale;
						y += (v1 + v2) / scale;
						break;
					}
					
					// Circle
					case "c":
					case "C":{
						const radius = (args[0] / scale) / 2;
						context.beginPath();
						context.ellipse(x + radius, y, radius, radius, 0, 0, 2 * Math.PI);
						x += radius * 2;
						("c" === type)
							? context.stroke()
							: fill();
						break;
					}
					
					// Ellipse
					case "e":
					case "E":{
						const radiusX = (args[0] / scale) / 2;
						const radiusY = (args[1] / scale) / 2;
						context.beginPath();
						context.ellipse(x + radiusX, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
						x += radiusX * 2;
						("e" === type)
							? context.stroke()
							: fill();
						break;
					}
					
					// Drawing colour
					case "F":
						drawColour = parseColour(data);
						break;
					
					// Drawing colour (legacy)
					case "f":
						drawColour = (args[0] < 0 || args[0] > 1000)
							? context.fillStyle
							: parseColour(`g${args[0]}`);
						break;
					
					// Line
					case "l":
						context.moveTo(x, y);
						x += +args[0] / scale;
						y += +args[1] / scale;
						context.lineTo(x, y);
						context.stroke();
						break;
					
					// Polygon
					case "p":
					case "P":{
						context.beginPath();
						context.moveTo(x, y);
						let tmpX = x;
						let tmpY = y;
						let endX = 0;
						let endY = 0;
						const {length} = args;
						for(let i = 0; i < length; i += 2){
							const lineX = args[i]   / scale;
							const lineY = args[i+1] / scale;
							endX += lineX;
							endY += lineY;
							tmpX = tmpX + lineX;
							tmpY = tmpY + lineY;
							context.lineTo(tmpX, tmpY);
						}
						x += endX;
						y += endY;
						context.closePath();
						("p" === type)
							? context.stroke()
							: fill();
						break;
					}
					
					// Line thickness
					case "t":{
						let width = +args[0] / scale;
						if(width < 0)
							width = ((res[0] / (72 * sizeScale)) * 40 * charSize) / 1000;
						context.lineWidth = width;
						x += width;
						break;
					}
				}
				break;
			}
			
			case tokenTypes.INFORM_EOL:
				if(null !== mark){
					markEnd();
					markWrap = true;
				}
				break;
			
			case tokenTypes.MOVE_ABS_H:
				x = +data / scale;
				break;
			
			case tokenTypes.MOVE_ABS_V:
				y = +data / scale;
				break;
			
			case tokenTypes.MOVE_PRINT:{
				const [cols, char] = data.replace(/\s+/g, "").split(/(?=.$)/);
				x += Math.floor(+cols / res[1]) / scale;
				text(char);
				break;
			}
			
			case tokenTypes.MOVE_REL_H:
				x += +data / scale;
				break;
			
			case tokenTypes.MOVE_REL_V:
				y += +data / scale;
				break;
			
			case tokenTypes.SET_COLOUR:{
				colour = parseColour(data);
				context.fillStyle = colour;
				context.strokeStyle = colour;
				break;
			}
			
			case tokenTypes.SET_FONT:
				font = fonts[data];
				context.font = font[0] + charSize + font[1];
				break;
			
			case tokenTypes.SET_SIZE:
				charSize = +data / scale;
				context.font = font[0] + charSize + font[1];
				if(lineWidth < 1){
					const width = ((res[0] / (72 * sizeScale)) * 40 * charSize) / 1000;
					context.lineWidth = width;
					x += width;
				}
				break;
			
			case tokenTypes.TEXT_NORMAL:
				text(data);
				x += context.measureText(data).width;
				break;

			case tokenTypes.TEXT_TRACKED:{
				const args = data.split(/\s+/);
				const spacing = +args[0] / scale;
				for(const glyph of args[1].split("")){
					const {width} = context.measureText(glyph);
					text(glyph);
					x += width + spacing;
				}
				break;
			}
		}
	}
	
	return {marks, devCmds};
}


function parseColour(token){
	let args = token.substr(1).trim().split(/\s+/);
	
	switch(token[0]){
		// CMY
		case "c":
			args = args.map(a => (1 - Math.round(a / 65536)) * 255);
			return `rgb(${ args.join() })`;
		
		// CMYK
		case "k":
			const [c, m, y, k] = args.map(a => Math.round(a / 65536));
			args = [
				255 * (1 - c) * (1 - k),
				255 * (1 - m) * (1 - k),
				255 * (1 - y) * (1 - k),
			];
			return `rgb(${ args.join() })`;
		
		// RGB
		case "r":
			args = args.map(a => Math.round(a / 257));
			return `rgb(${ args.join() })`;
		
		// Greyscale
		case "g":
			args = new Array(3).fill(Math.round(args[0] / 257));
			return `rgb(${ args.join() })`;
		
		default: return "#000";
	}
}


function parseMark(args, x, y, scale = 1){
	const rst   = (+args[2] + +args[4]) / scale;
	const rsb   = (+args[3] - +args[4]) / scale;
	const lead  =  +args[4] / scale;
	const mark  = {
		args, lead,
		x: x - lead,
		y: y - rst,
		width:  0,
		height: (y - rsb) - (y - rst),
		border: {
			cornerRadiusH: 0,
			cornerRadiusV: 0,
			colour: [0, 0, 0],
			dashGaps: [],
			thickness: 0,
		},
		[Symbol.toStringTag]: "PDFHotspot",
		draw(context){
			if(!this.border.thickness) return;
			context.save();
			context.lineCap = "butt";
			context.lineJoin = "miter";
			context.lineWidth = this.border.thickness;
			context.setLineDash(this.border.dashGaps);
			context.strokeStyle = "rgb(" + this.border.colour.join(", ") + ")";
			context.strokeRect(this.x, this.y, this.width, this.height);
			context.restore();
		}
	};
	
	mark.unparsedArgs = args.slice(5).join(" ")
		.replace(/\s*\/Border\s+\[([^\[\]]+)\s*(?:\[([^\]]+)\]\s*)?\]/, (_, values, dash) => {
			values = values.trim().split(/\s+/);
			mark.border.cornerRadiusH = +values[0] || 0;
			mark.border.cornerRadiusV = +values[1] || 0;
			mark.border.thickness     = +values[2] || 0;
			if(dash){
				dash = dash.trim().split(/\s+/).map(n => +n);
				mark.border.dashGaps = dash;
			}
			return "";
		})
		.replace(/\s*\/Color\s*\[([^\]]+)\]/, (_, values) => {
			values = values.trim().split(/\s+/).map(n => Math.round(+n * 0xFF) || 0);
			mark.border.colour = values;
			return "";
		})
		.replace(/\/Subtype\s+\/Link\s+(.+)/, (_, data) => {
			if(/^\/Dest\s+\/(\S+)\s*$/.test(data))
				mark.targetDest = RegExp.lastParen;
			else if(/^\s*\/Action\s+<<\s*\/Subtype\s+\/URI/.test(data))
				mark.targetURI = data.match(/\/URI\s+\((\S*)\)\s+>>/)[1];
			return "";
		})
		.trim();
	return mark;
}


function drawArc(context, scale, h0, v0, h1, v1, h2, v2){
	const endX = h1 + h2;
	const endY = v1 + v2;
	const N    = endX * endX + endY * endY;
	
	if(0 !== N){
		let K            = .5 - (h1 * endX + v1 * endY) / N;
		let centreX      = h1 + (K * endX);
		let centreY      = v1 + (K * endY);
		const radius     = Math.sqrt(centreX * centreX + centreY * centreY) / scale;
		const startAngle = Math.atan2(-centreY, -centreX);
		const endAngle   = Math.atan2(v1 + v2 - centreY, h1 + h2 - centreX);
		centreX          = (h0 + centreX) / scale;
		centreY          = (v0 + centreY) / scale;
		context.beginPath();
		context.arc(centreX, centreY, radius, startAngle, endAngle, true);
		context.stroke();
	}

	else{
		context.beginPath();
		context.moveTo(h0 / scale, v0 / scale);
		context.lineTo((endX + h0) / scale, (endY + v0) / scale);
		context.stroke();
	}
}
