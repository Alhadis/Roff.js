"use strict";

/**
 * A resizeable, <canvas>-like interface for terminal drawing.
 * Spaces gets allocated as the "cursor" (the insertion pont),
 * moves to perform a drawing operation.
 * @class
 */
class TextGrid{
	
	constructor(width = 0, height = 0){
		this.colour = -1;
		this.font   = "R";
		const data  = [[]];
		let x       = 0;
		let y       = 0;
		let rows    = 0;
		let cols    = 0;
		
		Object.defineProperties(this, {
			charAbove: {
				get: () => 0 === y ? "" : (data[y - 1][x] || [""])[0],
				set: to => {
					if(0 !== y)
						data[y - 1][x] = [to, this.font, this.colour];
				}
			},
			charBelow: {
				get: () => y < rows - 1 ? (data[y + 1][x] || [""])[0] : "",
				set: to => {
					if(y === rows - 1)
						++this.rows;
					data[y + 1][x] = [to, this.font, this.colour];
				}
			},
			charBefore: {
				get: () => 0 === x ? "" : (data[y][x - 1] || [""])[0],
				set: to => {
					if(0 !== x)
						this.data[y][x - 1] = [to, this.font, this.colour];
				}
			},
			charAfter: {
				get: () => x < cols - 1 ? (data[y][x + 1] || [""])[0] : "",
				set: to => {
					if(x === cols - 1)
						++this.cols;
					data[y][x + 1] = [to, this.font, this.colour];
				}
			},
			currentChar: {
				get: () => {
					const cell = data[y][x];
					return cell
						? cell[0] || ""
						: "";
				},
				set: to => data[y][x] = [to, this.font, this.colour]
			},
			
			data: {
				get: () => data
			},
			
			rows: {
				get: () => rows,
				set: to => {
					to = Math.max(1, +to);
					if(to > rows)
						for(let i = rows; i < to; ++i)
							data.push(new Array(cols).fill(" ").map(c => [c, "R", -1]));
					else if(to < rows)
						rows.length = to;
					rows = to;
				}
			},
			
			cols: {
				get: () => cols,
				set: to => {
					to = Math.max(1, +to);
					if(to > cols)
						for(const row of data)
							for(let i = cols; i < to; ++i)
								row.push([" ", "R", -1]);
					else if(to < cols)
						for(const row of data)
							row.length = to;
					cols = to;
				}
			},
			
			x: {
				get: () => x,
				set: to => {
					x = Math.max(0, to);
					if(x > cols)
						this.cols = x;
				}
			},
			
			y: {
				get: () => y,
				set: to => {
					y = Math.max(0, to);
					if(y > rows)
						this.rows = y;
				}
			},
			
			width: {
				get: () => this.cols,
				set: to => this.cols = to
			},
			
			height: {
				get: () => this.rows,
				set: to => this.rows = to
			},
		});
		
		this.cols = width;
		this.rows = height;
	}
	
	
	drawLine(width, height = 0){
		width  = +width  || 0;
		height = +height || 0;
		const {x, y} = this;
		
		// Horizontal
		if(0 === height){
			let from = x;
			let to = Math.max(0, x + width);
			let endpoint = to;
			
			if(to > this.cols)
				this.cols = to;
			
			else if(width < 0){
				[to, from] = [from, to];
				endpoint = from;
			}
			
			for(let i = from; i < to; ++i){
				this.x = i;
				const {charAfter, charBefore, charAbove, charBelow, currentChar} = this;
				let char = "─";
				
				if(canJoinTop(currentChar) || canJoinBottom(currentChar)){
					const joinUp = canJoinBottom(charAbove);
					const joinDown = canJoinTop(charBelow);
					
					if(i === from){
						const joinLeft = canJoinRight(charBefore);
						if(joinUp){
							if(joinLeft && joinDown) char = "┼";
							else if(joinLeft)        char = "┴";
							else if(joinDown)        char = "├";
							else                     char = "└";
						}
						else{
							if(joinLeft && joinDown) char = "┬";
							else if(joinDown)        char = "┌";
						}
					}
					
					else if(i === to - 1){
						const joinRight = canJoinLeft(charAfter);
						if(joinUp){
							if(joinRight && joinDown) char = "┼";
							else if(joinRight)        char = "┴";
							else if(joinDown)         char = "┤";
							else                      char = "┘";
						}
						else{
							if(joinRight && joinDown) char = "┬";
							else if(joinDown)         char = "┐";
						}
					}
					else{
						if(joinUp && joinDown) char = "┼";
						else if(joinUp)        char = "┴";
						else if(joinDown)      char = "┬";
					}
				}
				
				this.data[y][i] = [char, this.font, this.colour];
			}
			return this.moveTo(endpoint, y);
		}
		
		// Vertical
		else if(0 === width){
			let from = y;
			let to = Math.max(0, y + height);
			let endpoint = to;
			
			if(to > this.rows)
				this.rows = to;
			
			else if(height < 0){
				[to, from] = [from, to];
				endpoint = from;
			}
			
			for(let i = from; i < to; ++i){
				this.y = i;
				const {charAfter, charBefore, charAbove, charBelow, currentChar} = this;
				let char = "│";
				
				if(canJoinLeft(currentChar) || canJoinRight(currentChar)){
					const joinLeft = canJoinRight(charBefore);
					const joinRight = canJoinLeft(charAfter);
					
					if(i === from){
						const joinTop = canJoinBottom(charAbove);
						if(joinLeft){
							if(joinTop && joinRight) char = "┼";
							else if(joinTop)         char = "┤";
							else if(joinRight)       char = "┬";
							else                     char = "┐";
						}
						else{
							if(joinTop && joinRight) char = "├";
							else if(joinRight)       char = "┌";
						}
					}
					
					else if(i === to - 1){
						const joinDown = canJoinTop(charBelow);
						if(joinLeft){
							if(joinRight && joinDown) char = "┼";
							else if(joinRight)        char = "┴";
							else if(joinDown)         char = "┤";
							else                      char = "┘";
						}
						else{
							if(joinRight && joinDown) char = "├";
							else if(joinRight)        char = "└";
						}
					}
					else{
						if(joinLeft && joinRight)   char = "┼";
						else if(joinLeft)           char = "┤";
						else if(joinRight)          char = "├";
					}
				}
				this.data[i][x] = [char, this.font, this.colour];
			}
			return this.moveTo(x, endpoint);
		}
		
		// Diagonal
		else if(Math.abs(width) === Math.abs(height)){
			let fromX = x;
			let fromY = y;
			let toX = Math.max(0, x + width);
			let toY = Math.max(0, y + height);
			let multX = 1;
			let multY = 1;
			
			if(toX > this.cols) this.cols = toX;
			else if(width < 0)  multX = -1;
			
			if(toY > this.rows) this.rows = toY;
			else if(height < 0) multY = -1;
			
			const char = (width < 0 && height < 0 || width > 0 && height > 0) ? "╲" : "╱";
			const delta = Math.abs(width);
			for(let i = 0; i < delta; ++i){
				const x = fromX + (i * multX);
				const y = fromY + (i * multY);
				if(x < 0 || y < 0) continue;
				const oldChar = (this.data[y][x] || [""])[0];
				const newChar =  "╳" === oldChar || oldChar !== char && ("╲" === oldChar || "╱" === oldChar)
					? "╳"
					: char;
				this.data[y][x] = [newChar, this.font, this.colour];
			}
			return this.moveTo(toX, toY);
		}
		
		else return this;
	}
	
	
	draw(lines){
		for(const [w, h] of lines){
			if(0 === w) (h < 0)
				? this.down().drawLine(0, h - 1)
				: this.drawLine(0, h + 1).up();
			else if(0 === h) (w < 0)
				? this.right().drawLine(w - 1, 0)
				: this.drawLine(w + 1, 0).left();
			else if(Math.abs(w) === Math.abs(h)){
				this.drawLine(w, h);
				h > 0 && this.up();
			}
		}
		return this;
	}


	box(width, height = 0){
		width  = +width  || 0;
		height = +height || width;
		return this.draw([
			[width,  0],
			[0,      height],
			[-width, 0],
			[0,     -height],
		]).moveBy(width);
	}


	polygon(points){
		const {length} = points;
		const lines = [];
		const first = points[0];
		let [x, y] = first;
		for(let i = 1; i < length; ++i){
			lines.push([
				points[i][0] - x,
				points[i][1] - y,
			]);
			[x, y] = points[i];
		}
		[x, y] = first;
		lines.push([
			x - points[length - 1][0],
			y - points[length - 1][1],
		]);
		return this.moveTo(x, y).draw(lines);
	}
	
	
	moveBy(x, y){
		this.x += x;
		this.y += y;
		return this;
	}
	
	
	moveTo(x, y){
		this.x = x;
		this.y = y;
		return this;
	}
	
	
	left(cols = 1){
		this.x -= cols;
		return this;
	}
	
	right(cols = 1){
		this.x += cols;
		return this;
	}
	
	down(lines = 1){
		this.y += lines;
		return this;
	}
	
	up(lines = 1){
		this.y -= lines;
		return this;
	}
	
	
	asciify(format = "text"){
		return this.toString(format)
			.replace(/\u{2500}/ug, "-")
			.replace(/\u{2502}/ug, "|")
			.replace(/\u{2571}/ug, "/")
			.replace(/\u{2572}/ug, "\\")
			.replace(/\u{2573}/ug, "X")
			.replace(/[^-|\\X\/\s]/ug, "+");
	}
	
	
	toString(format = "html"){
		const fn = "html" === format
			? toHTML
			: toPlainText;
		return this.data.map(fn).join("\n");
	}


	read(text){
		if(!text) return this;
		let yOffset = 0;
		const {length} = text;
		for(let i = 0; i < length; ++i){
			const next = text.charCodeAt(i + 1) || -1;
			switch(text.charCodeAt(i)){
				
				// Backspace
				case 0x08:
					this.left();
					break;
				
				// Horizontal tab
				case 0x09:
					this.x |= 7;
					++this.x;
					break;

				// Vertical tab ("Line tabulation")
				case 0x0B:
					this.up();
					break;

				// Carriage return
				case 0x0D:
					if(0x0A === next)
						continue;
					this.x = 0;
					break;

				// Newline
				case 0x0A:
				case 0x85:
					this.write("\n");
					break;

				// Form feed
				case 0x0C:
					this.down();
					break;

				// Shift out: Enable reverse video
				case 0x0E:
					break;

				// Shift in: Disable reverse video
				case 0x0F:
					break;

				// Space
				case 0x20:
					this.right();
					break;

				// Escape
				case 0x1B:
					switch(next){
						// Full-reverse line feed
						case 0x07:
						case 0x37:
							this.up();
							yOffset = 0;
							++i;
							break;

						// Half-reverse line feed
						case 0x08:
						case 0x38:
							++i;
							yOffset -= 0.5;
							if(-1 === yOffset){
								yOffset = 0;
								this.up();
							}
							break;
						
						// Half-forward line feed
						case 0x09:
						case 0x39:
							++i;
							yOffset += 0.5;
							if(1 === yOffset){
								yOffset = 0;
								this.down();
							}
							break;

						// CSI introducer (omitted for now)
						case 0x5B:
							break;
					}
					break;

				// Anything else
				default:{
					const char = this.currentChar;
					
					if(char && /\S/.test(char)){
						const prevFont = this.data[this.y][this.x][1];
						
						// Underline
						if("_" === char || "_" === text[i]){
							this.font = ("B" === prevFont || "BI" === prevFont) ? "BI" : "I";
							this.write("_" === char ? text[i] : char);
							this.font = "R";
						}
						
						// Embolden
						else if(/\S/.test(text[i]) && text[i] === char){
							this.font = ("I" === prevFont || "BI" === prevFont) ? "BI" : "B";
							this.write(char);
							this.font = "R";
						}
						
						// Print normally
						else this.write(text[i]);
					}
					else this.write(text[i]);
				}
			}
		}
		return this;
	}
	
	
	write(text){
		if(!text) return this;
		const {length} = text;
		const {font, colour} = this;
		for(let i = 0; i < length; ++i){
			const char = text[i];
			if("\n" === char){
				++this.y;
				this.x = 0;
			}
			else this.data[this.y][this.x++] = [char, font, colour];
		}
		return this;
	}
	
	
	writeln(text){
		return this.write(text + "\n");
	}
	
	
	colourByCMYK(c, m, y, k = null){
		let r, g, b;
		
		// CMY
		if(k === null){
			r = (1 - c) * 255;
			g = (1 - m) * 255;
			b = (1 - y) * 255;
		}
		
		// CMYK
		else{
			r = 255 * (1 - c) * (1 - k);
			g = 255 * (1 - m) * (1 - k);
			b = 255 * (1 - y) * (1 - k);
		}
		
		this.colourByRGB(r, g, b);
	}
	
	colourByRGB(r, g, b){
		const hex = [r, g, b].map(c => (c < 10 ? "0" : "") + c.toString(16)).join("");
		if(-1 !== (this.colour = palettes[0].indexOf(hex))
		|| -1 !== (this.colour = palettes[1].indexOf(hex)))
			return;
		else this.colour = -1;
	}
	
	colourByGrey(shade){
		this.colourByRGB(shade, shade, shade);
	}
}


module.exports = TextGrid;

	
function canJoinBottom(char){
	switch(char){
		case "│": case "┌": case "┐": case "├":
		case "┤": case "┬": case "┼":
			return true;
	}
	return false;
}

function canJoinLeft(char){
	switch(char){
		case "─": case "┐": case "┘": case "┤":
		case "┬": case "┴": case "┼":
			return true;
	}
	return false;
}

function canJoinRight(char){
	switch(char){
		case "─": case "┌": case "└": case "├":
		case "┬": case "┴": case "┼":
			return true;
	}
	return false;
}

function canJoinTop(char){
	switch(char){
		case "│": case "└": case "┘": case "├":
		case "┤": case "┴": case "┼":
			return true;
	}
	return false;
}


function toPlainText(row){
	return row.map(cell => cell[0]).join("");
}

function toHTML(row, addLinks = true){
	let output = "";
	let cell, prev;
	
	const {length} = row;
	for(let i = 0; i < length; ++i){
		cell = row[i];
		let char = cell[0];
		switch(char){
			case "<": char = "&lt;";  break;
			case ">": char = "&gt;";  break;
			case "&": char = "&amp;"; break;
		}
		if(0 === i)
			output += getOpenTag(cell[1], cell[2]) + char;
		else{
			prev = row[i - 1];
			if(prev[1] !== cell[1] || prev[2] !== cell[2]){
				if(prev[2] === cell[2])
					output += getCloseTag(prev[1]) + getOpenTag(cell[1]);
				else
					output += getCloseTag(prev[1], prev[2]) + getOpenTag(cell[1], cell[2]);
			}
			output += char;
			if(i === length - 1)
				output += getCloseTag(cell[1], cell[2]);
		}
	}
	
	output = output
		.replace(/(<[bu][^>]*>)(\s+)/g, "$2$1")
		.replace(/(\s+)(<\/[bu]>)/g, "$2$1")
		.replace(/ +$/gm, "");
	
	if(addLinks){
		const manpages = /(^|\s)(<(b|u)[^>]*>)?([a-z0-9][^\s\/<>"'\\]+)(<\/\3>)?\((\d\w{0,3})\)/g;
		output = output.replace(manpages, (...args) => {
			const start    = args[1];
			const openTag  = args[2] || "";
			const title    = args[4];
			const closeTag = args[5] || "";
			const section  = args[6];
			return `${start}<a href="man://${title}/${section}">${openTag}${title}${closeTag}(${section})</a>`;
		});
		
		const webLinks = /(^|\s|⟨|&lt;)(https?:\/\/[^\s⟨⟩<>"']+?)($|\s|⟩|&gt;)/gi;
		output = output.replace(webLinks, (_, before, url, after) =>
			`${before}<a href="${url}">${url}</a>${after}`);
		
		const mailLinks = /(^|\s|⟨|>|&lt;)(\w[-\w.]+@\w[-\w.]+\.[-\w.]+\w)($|\s|⟩|<|&gt;)/gi;
		output = output.replace(mailLinks, (_, before, addr, after) =>
			`${before}<a href="mailto:${addr}">${addr}</a>${after}`);
	}
	
	return output;
}

function getOpenTag(font, colour = -1){
	const attr = -1 !== colour
		? ` data-sgr="${colour}" style="color:#${SGRColours[colour]}"`
		: "";
	switch(font){
		case "B":  return "<b" + attr + ">";
		case "I":  return "<u" + attr + ">";
		case "BI": return "<b" + attr + "><u>";
		default:   return attr
			? "<span" + attr + ">"
			: "";
	}
}

function getCloseTag(font, colour = -1){
	switch(font){
		case "B":  return "</b>";
		case "I":  return "</u>";
		case "BI": return "</u></b>";
		default:   return -1 !== colour
			? "</span>"
			: "";
	}
}


const isDarwin = !!(global.process && "darwin" === global.process.platform);
const palettes = [
	// Terminal.app
	["000000","c23621", "25bc24", "adad27", "492ee1", "d338d3", "33bbc8", "cbcccd", "818383",
	"fc391f", "31e722", "eaec23", "5833ff", "f935f8", "14f0f0", "e9ebeb"],
	
	// xterm
	["000000","cd0000", "00cd00", "cdcd00", "00ee00", "cd00cd", "00cdcd", "e5e5e5", "7f7f7f",
	"ff0000", "00ff00", "ffff00", "5c5cff", "ff00ff", "00ffff", "ffffff"],
	
	// 256-colour mode
	["000000","00005f", "000087", "0000af", "0000d7", "0000ff", "005f00", "005f5f", "005f87",
	"005faf", "005fd7", "005fff", "008700", "00875f", "008787", "0087af", "0087d7", "0087ff",
	"00af00", "00af5f", "00af87", "00afaf", "00afd7", "00afff", "00d700", "00d75f", "00d787",
	"00d7af", "00d7d7", "00d7ff", "00ff00", "00ff5f", "00ff87", "00ffaf", "00ffd7", "00ffff",
	"5f0000", "5f005f", "5f0087", "5f00af", "5f00d7", "5f00ff", "5f5f00", "5f5f5f", "5f5f87",
	"5f5faf", "5f5fd7", "5f5fff", "5f8700", "5f875f", "5f8787", "5f87af", "5f87d7", "5f87ff",
	"5faf00", "5faf5f", "5faf87", "5fafaf", "5fafd7", "5fafff", "5fd700", "5fd75f", "5fd787",
	"5fd7af", "5fd7d7", "5fd7ff", "5fff00", "5fff5f", "5fff87", "5fffaf", "5fffd7", "5fffff",
	"870000", "87005f", "870087", "8700af", "8700d7", "8700ff", "875f00", "875f5f", "875f87",
	"875faf", "875fd7", "875fff", "878700", "87875f", "878787", "8787af", "8787d7", "8787ff",
	"87af00", "87af5f", "87af87", "87afaf", "87afd7", "87afff", "87d700", "87d75f", "87d787",
	"87d7af", "87d7d7", "87d7ff", "87ff00", "87ff5f", "87ff87", "87ffaf", "87ffd7", "87ffff",
	"af0000", "af005f", "af0087", "af00af", "af00d7", "af00ff", "af5f00", "af5f5f", "af5f87",
	"af5faf", "af5fd7", "af5fff", "af8700", "af875f", "af8787", "af87af", "af87d7", "af87ff",
	"afaf00", "afaf5f", "afaf87", "afafaf", "afafd7", "afafff", "afd700", "afd75f", "afd787",
	"afd7af", "afd7d7", "afd7ff", "afff00", "afff5f", "afff87", "afffaf", "afffd7", "afffff",
	"d70000", "d7005f", "d70087", "d700af", "d700d7", "d700ff", "d75f00", "d75f5f", "d75f87",
	"d75faf", "d75fd7", "d75fff", "d78700", "d7875f", "d78787", "d787af", "d787d7", "d787ff",
	"d7af00", "d7af5f", "d7af87", "d7afaf", "d7afd7", "d7afff", "d7d700", "d7d75f", "d7d787",
	"d7d7af", "d7d7d7", "d7d7ff", "d7ff00", "d7ff5f", "d7ff87", "d7ffaf", "d7ffd7", "d7ffff",
	"ff0000", "ff005f", "ff0087", "ff00af", "ff00d7", "ff00ff", "ff5f00", "ff5f5f", "ff5f87",
	"ff5faf", "ff5fd7", "ff5fff", "ff8700", "ff875f", "ff8787", "ff87af", "ff87d7", "ff87ff",
	"ffaf00", "ffaf5f", "ffaf87", "ffafaf", "ffafd7", "ffafff", "ffd700", "ffd75f", "ffd787",
	"ffd7af", "ffd7d7", "ffd7ff", "ffff00", "ffff5f", "ffff87", "ffffaf", "ffffd7", "ffffff",
	"080808", "121212", "1c1c1c", "262626", "303030", "3a3a3a", "444444", "4e4e4e", "585858",
	"626262", "6c6c6c", "767676", "808080", "8a8a8a", "949494", "9e9e9e", "a8a8a8", "b2b2b2",
	"bcbcbc", "c6c6c6", "d0d0d0", "dadada", "e4e4e4", "eeeeee"]
];
const SGRColours = palettes[+!isDarwin].concat(palettes[2]);
