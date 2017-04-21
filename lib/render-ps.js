"use strict";

const charnames    = require("./charnames.js");
const DeviceDriver = require("./device-driver.js");
const driver       = new DeviceDriver("/usr/local/share/groff/current/font/devps");
const {tokenise, tokenTypes} = require("./tokeniser.js");

module.exports = function(context, text){
	const pages = tokenisePages(text);
	renderToCanvas(context, pages[4]);
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
				
				switch(type){
					
					// B-spline
					case "~":
						break;
					
					// Arc
					case "a":
						break;
					
					// Solid circle
					case "C":
						break;
					
					// Outlined circle
					case "c":
						break;
					
					// Solid ellipse
					case "E":
						break;
					
					// Outlined ellipse
					case "e":
						break;
					
					// Fill colour
					case "F":
						break;
					
					// Fill colour (old)
					case "f":
						break;
					
					// Straight line
					case "l":
						context.moveTo(x, y);
						x += +args[0] / sizeScale * devicePixelRatio;
						y += +args[1] / sizeScale * devicePixelRatio;
						context.lineTo(x, y);
						context.stroke();
						break;
					
					// Outlined polygon
					case "p":
						break;
					
					// Filled polygon
					case "P":
						break;
					
					// Set line thickness
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
				let colour = "#000";
				let args = data.substr(1).split(/\s+/);
				switch(data[0]){
					// CMY
					case "c":{
						args = args.map(a => (1 - Math.round(a / 65536)) * 255);
						colour = `rgb(${ args.join() })`;
						break;
					}
					
					// CMYK
					case "k":
						const [c, m, y, k] = args.map(a => Math.round(a / 65536));
						args = [
							255 * (1 - c) * (1 - k),
							255 * (1 - m) * (1 - k),
							255 * (1 - y) * (1 - k),
						];
						colour = `rgb(${ args.join() })`;
						break;
					
					// RGB
					case "r":
						args = args.map(a => Math.round(a / 257));
						colour = `rgb(${ args.join() })`;
						break;
					
					// Greyscale
					case "g":
						args = new Array(3).fill(Math.round(args[0] / 257));
						colour = `rgb(${ args.join() })`;
						break;
				}
				context.fillStyle   = colour;
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
