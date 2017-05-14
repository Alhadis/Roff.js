"use strict";

const charnames = require("./charnames.js");
const TTYCanvas = require("./tty-canvas.js");
const {tokenise, tokenTypes} = require("./tokeniser.js");
const {toString} = String.prototype;


module.exports = function(text){
	const tokens = tokenise(text);
	return parseTTY(tokens);
};

function parseTTY(tokens){
	const fonts    = ["", "", "", ""];
	const res      = [240, 24, 40];
	let output     = "";
	let page       = null;
	let ulMode     = 0;
	let xFraction  = 0;
	
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
					// Output resolution
					case "r":
						res[0] = +args[0] || 0;
						res[1] = +args[1] || 0;
						res[2] = +args[2] || 0;
						break;
					
					// Mount font
					case "f":
						fonts[args[0]] = args[1];
						break;
					
					// Underline mode
					case "u":
						ulMode = +args[0];
						break;
				}
				break;
			}
			
			case tokenTypes.BEGIN_PAGE:{
				let font   = null;
				let colour = null;
				if(null !== page){
					output += page.toString().replace(/^ *\n/, "") + "\n";
					font    = page.font;
					colour  = page.colour;
				}
				page = new TTYCanvas();
				if(null !== font){
					page.font   = font;
					page.colour = colour;
				}
				break;
			}
			
			case tokenTypes.CHAR_INDEXED:{
				const char = String.fromCharCode(+data);
				const {x, y} = page;
				page.write(char).moveTo(x, y);
				break;
			}
			
			case tokenTypes.CHAR_LITERAL:{
				const {x, y} = page;
				page.write(data).moveTo(x, y);
				break;
			}
			
			case tokenTypes.CHAR_NAMED:{
				const char = charnames[data];
				const {x, y} = page;
				page.write(char).moveTo(x, y);
				break;
			}
			
			case tokenTypes.DRAWING:{
				const [type, ...args] = data.split(/\s+/);
				switch(type){
					case "l":
						page.draw([[+args[0] / res[1], +args[1] / res[2]]]);
						break;
				}
				break;
			}
			
			case tokenTypes.MOVE_ABS_H:
				page.x = Math.floor(+data / res[1]);
				xFraction = 0;
				break;
			
			case tokenTypes.MOVE_ABS_V:
				page.y = Math.floor(+data / res[2]);
				break;
			
			case tokenTypes.MOVE_PRINT:{
				const [cols, char] = data.replace(/\s+/g, "").split(/(?=.$)/);
				page.x += Math.floor(+cols / res[1]);
				const {x, y} = page;
				page.write(char).moveTo(x, y);
				break;
			}
			
			case tokenTypes.MOVE_REL_H:{
				const cols = Math.floor(xFraction + (+data / res[1]));
				const char = page.currentChar || " ";
				const {font} = page;
				
				if(cols < 0
				|| "R" === font && -1 === page.colour
				||("I" === font || "BI" === font) && 0 === ulMode)
					page.x += cols;
				
				else{
					const isBlank = " " === char;
					if(isBlank && 1 === cols)
						page.write(" ");
					else{
						let blankRight = isBlank;
						if(blankRight){
							const {width, y} = page;
							for(let i = page.x; i < width; ++i){
								const cell = page.data[y][i];
								if(cell && cell[0] && cell[0] !== " "){
									blankRight = false;
									break;
								}
							}
							if(blankRight) page.write(" ".repeat(cols));
							else           page.x += cols;
						}
						else page.x += cols;
					}
				}
				break;
			}
			
			case tokenTypes.MOVE_REL_V:
				page.y += Math.floor(+data / res[2]);
				break;
			
			case tokenTypes.SET_COLOUR:{
				const mode = data[0];
				let args = data.substr(1).split(/\s+/);
				switch(mode){
					default:
						page.colour = -1;
						break;
					case "c":
					case "k":
						args = args.map(a => Math.round(a / 65536));
						page.colourByCMYK(...args);
						break;
					case "r":
						args = args.map(a => Math.round(a / 257));
						page.colourByRGB(...args);
						break;
					case "g":
						page.colourByGrey(Math.round(args[0] / 257));
						break;
				}
				break;
			}
			
			case tokenTypes.SET_FONT:
				page.font = fonts[data];
				break;
			
			case tokenTypes.TEXT_NORMAL:
				page.write(data);
				break;
			
			case tokenTypes.TEXT_TRACKED:{
				const args = data.match(/^(\d+)\s*(.*)$/);
				const spacing = +args[1] / res[1];
				const origin = page.x;
				let total = xFraction || 0;
				for(const char of args[2].split("")){
					page.write(char);
					total += spacing + 1;
					page.x = origin + Math.floor(total);
					xFraction = total % 1;
				}
				break;
			}
		}
	}
	
	if(null !== page)
		output += page.toString().replace(/^ *\n/, "");
	
	return output;
}
