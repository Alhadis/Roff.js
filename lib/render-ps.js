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


function renderToCanvas(context, tokens){
	const {sizeScale} = driver;
	const res      = [0, 0, 0];
	let charHeight = 0;
	let charSize   = 0;
	let colour     = "#000";
	let drawColour = "#000";
	let font       = null;
	let fontName   = "sans-serif";
	let slant      = 0;
	let sourceFile = "";
	let x          = 0;
	let y          = 0;
	
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
						charHeight = +args[0];
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
						break;
				}
				break;
			}
			
			case tokenTypes.CHAR_INDEXED:{
				const char = String.fromCharCode(+data);
				context.fillText(char, x, y);
				break;
			}
			
			case tokenTypes.CHAR_LITERAL:
				context.fillText(data, x, y);
				break;
			
			case tokenTypes.CHAR_NAMED:
				context.fillText(charnames[data], x, y);
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
					case "~":
						break;
					
					// Arc
					case "a":{
						const centreX = x + args[0] / sizeScale * devicePixelRatio;
						const centreY = y + args[1] / sizeScale * devicePixelRatio;
						const endX    = x + args[2] / sizeScale * devicePixelRatio;
						const endY    = y + args[3] / sizeScale * devicePixelRatio;
						const radius  = Math.sqrt(Math.pow(centreX - x, 2) + Math.pow(centreY - y, 2));
						
						context.moveTo(x, y);
						context.beginPath();
						context.arc(centreX, centreY, radius, 0, Math.atan2(endY - y, x - endX));
						context.stroke();
						x = endX;
						y = endY;
						context.moveTo(x, y);
						break;
					}
					
					// Circle
					case "c":
					case "C":{
						const radius = (args[0] / sizeScale * devicePixelRatio) / 2;
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
						const radiusX = (args[0] / sizeScale * devicePixelRatio) / 2;
						const radiusY = (args[1] / sizeScale * devicePixelRatio) / 2;
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
						x += +args[0] / sizeScale * devicePixelRatio;
						y += +args[1] / sizeScale * devicePixelRatio;
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
							const lineX = args[i]   / sizeScale * devicePixelRatio;
							const lineY = args[i+1] / sizeScale * devicePixelRatio;
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
					case "t":
						break;
				}
				break;
			}
			
			case tokenTypes.MOVE_ABS_H:
				x = +data / sizeScale * devicePixelRatio;
				break;
			
			case tokenTypes.MOVE_ABS_V:
				y = +data / sizeScale * devicePixelRatio;
				break;
			
			case tokenTypes.MOVE_PRINT:{
				const [cols, char] = data.replace(/\s+/g, "").split(/(?=.$)/);
				x += Math.floor(+cols / res[1]) / sizeScale * devicePixelRatio;
				context.fillText(char);
				break;
			}
			
			case tokenTypes.MOVE_REL_H:
				x += +data / sizeScale * devicePixelRatio;
				break;
			
			case tokenTypes.MOVE_REL_V:
				y += +data / sizeScale * devicePixelRatio;
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
				charSize = +data / sizeScale * devicePixelRatio;
				context.font = `${charSize}px ${fontName}`;
				break;
			
			case tokenTypes.TEXT_NORMAL:
				context.fillText(data, x, y);
				x += context.measureText(data).width;
				break;

			case tokenTypes.TEXT_TRACKED:
				// TODO
				break;
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
