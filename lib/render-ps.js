"use strict";

const charnames    = require("./charnames.js");
const DeviceDriver = require("./device-driver.js");
const driver       = new DeviceDriver("/usr/local/share/groff/current/font/devps");
const {tokenise, tokenTypes} = require("./tokeniser.js");

module.exports = function(context, text){
	const pages = tokenisePages(text);
	renderToCanvas(context, pages[0]);
};


function tokenisePages(text){
	const prologue = [];
	return text.replace(/^(?:[^\n]*\n)+?(?=\s*p\s*\d)/, match => {
		prologue.push(...tokenise(match));
		return "";
	})
	.split(/\n\s*(?=p\s*\d)/)
	.map(page => prologue.concat(tokenise(page)));
}


function renderToCanvas(context, tokens, zoom = 1.5){
	const scale    = driver.sizeScale / window.devicePixelRatio / zoom;
	const res      = [0, 0, 0];
	let charHeight = 0;
	let charSize   = 0;
	let colour     = "#000";
	let drawColour = "#000";
	let font       = null;
	let fontName   = "sans-serif";
	let lineWidth  = 1;
	let slant      = 0;
	let sourceFile = "";
	let tm         = null;
	let x          = 0;
	let y          = 0;
	
	const text = s => {
		if(null !== tm){
			context.translate(x, y);
			context.transform(...tm);
			context.translate(-x, -y);
		}
		context.fillText(s, x, y);
		context.resetTransform();
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
	
	context.lineCap  = "round";
	context.lineJoin = "round";
	context.moveTo(x, y);
	const {length} = tokens;
	for(let i = 0; i < length; ++i){
		const token = tokens[i];
		const type  = token[0];
		
		if(type === tokenTypes.COMMENT)
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
						driver.mountFont(args[0], args[1]);
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
							width = ((driver.res / (72 * driver.sizeScale)) * 40 * charSize) / 1000;
						context.lineWidth = width;
						x += width;
						break;
					}
				}
				break;
			}
			
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
				font = driver.mountedFonts[data];
				fontName = font.internalName;
				context.font = `${charSize}px ${fontName}`;
				break;
			
			case tokenTypes.SET_SIZE:
				charSize = +data / scale;
				context.font = `${charSize}px ${fontName}`;
				if(lineWidth < 1){
					const width = ((driver.res / (72 * driver.sizeScale)) * 40 * charSize) / 1000;
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
}


function parseColour(token){
	let args = token.substr(1).split(/\s+/);
	
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
