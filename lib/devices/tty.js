"use strict";

const OutputDevice = require("../output-device.js");
const TextGrid     = require("../text-grid.js");
const {toString}   = String.prototype;


class TTYDevice extends OutputDevice {

	reset(){
		this.fonts     = ["", "", "", ""];
		this.res       = [240, 24, 40];
		this.output    = "";
		this.page      = null;
		this.ulMode    = 0;
		this.xFraction = 0;
	}
	
	
	parse(data){
		this.reset();
		super.parse(data);
		if(null !== this.page){
			this.output += this.page.toString().replace(/^ *\n/, "");
			this.page = null;
		}
		return this.output;
	}


	handleDeviceControl(name, ...args){
		switch(name[0]){
			// Output resolution
			case "r":
				this.res[0] = +args[0] || 0;
				this.res[1] = +args[1] || 0;
				this.res[2] = +args[2] || 0;
				this.verifySaneResolution();
				break;
			
			// Mount font
			case "f":
				this.fonts[args[0]] = args[1];
				break;
			
			// Underline mode
			case "u":
				this.ulMode = +args[0];
				break;
		}
	}
	
	
	verifySaneResolution(){
		if(this.res[0] > 1000){
			const message = "Wrong output resolution for selected device:\n"
				+ "\tExpected: ~240\n"
				+ "\tActual:   " + this.res[0] + "\n"
				+ "Parsing that as monospaced TTY output will murder your memory heap.";
			throw new RangeError(message);
		}
	}
	
	
	printOutput(){
		const {output} = this;
		if(process.stdout.isTTY){
			const output = this.htmlToSGR(output.replace(/\s+$/, ""));
			process.stdout.write(output);
		}
		else process.stdout.write(output);
		process.stdout.write("\n");
	}
	

	htmlToSGR(input){
		return input
			.replace(/^\n+/,   "")
			.replace(/<b>/g,   "\x1B[1m")
			.replace(/<u>/g,   "\x1B[4m")
			.replace(/<\/b>/g, "\x1B[22m")
			.replace(/<\/u>/g, "\x1B[24m")
			.replace(/<b data-sgr="(\d+)"[^>]+>/g,    "\x1B[1;38;5;$1m")
			.replace(/<u data-sgr="(\d+)"[^>]+>/g,    "\x1B[4;38;5;$1m")
			.replace(/<span data-sgr="(\d+)"[^>]+>/g, "\x1B[38;5;$1m")
			.replace(/<\/span>/g, "\x1B[39m")
			.replace(/<a[^>]+>|<\/a>/g, "")
			.replace(/&lt;/g,  "<")
			.replace(/&gt;/g,  ">")
			.replace(/&amp;/g, "&")
			.replace(/&#(\d+);/g, (_,c) => String.fromCharCode(c));
	}
	
	
	beginPage(number){
		let activeFont   = null;
		let activeColour = null;
		
		if(null !== this.page){
			this.output += this.page.toString().replace(/^ *\n/, "") + "\n";
			activeFont   = this.page.font;
			activeColour = this.page.colour;
		}
		
		this.page = new TextGrid();
		if(null !== activeFont){
			this.page.font   = activeFont;
			this.page.colour = activeColour;
		}
	}
	
	
	printChar(data){
		const {x, y} = this.page;
		this.page.write(data).moveTo(x, y);
	}
	
	
	printCharByIndex(char, index){
		const {x, y} = this.page;
		this.page.write(char).moveTo(x, y);
	}
	
	
	printCharByName(name){
		const chars = require("../charnames.json");
		const {x, y} = this.page;
		this.page.write(chars[name] || "").moveTo(x, y);
	}
	
	
	handleDrawingCommand(type, ...args){
		switch(type){
			case "l":
				this.page.draw([[
					+args[0] / this.res[1],
					+args[1] / this.res[2],
				]]);
				break;
			
			case "p":{
				let w = 0;
				let h = 0;
				const coords = [];
				const {length} = args;
				
				for(let i = 0; i < length; i += 2){
					let x = +args[i]   / this.res[1];
					let y = +args[i+1] / this.res[2];
					
					if(!(0 === x || 0 === y))
						return;
					
					coords.push([x, y]);
					w += x;
					h += y;
				}
				
				if(!(0 === w || 0 === h))
					return;
				
				coords.push([-w, -h]);
				this.page.draw(coords);
				break;
			}
		}
	}
	
	
	moveToX(data){
		this.page.x = Math.floor(data / this.res[1]);
		this.xFraction = 0;
	}
	
	
	moveToY(data){
		this.page.y = Math.floor(data / this.res[2]);
	}
	
	
	moveThenPrint(cols, char){
		this.page.x += Math.floor(cols / this.res[1]);
		const {x, y} = this.page;
		this.page.write(char).moveTo(x, y);
	}
	
	
	moveByX(data){
		const cols = Math.floor(this.xFraction + (data / this.res[1]));
		const char = this.page.currentChar || " ";
		const {font} = this.page;
		
		if(cols < 0
		|| "R" === font && -1 === this.page.colour
		||("I" === font || "BI" === font) && 0 === this.ulMode)
			this.page.x += cols;
		
		else{
			const isBlank = " " === char;
			if(isBlank && 1 === cols)
				this.page.write(" ");
			else{
				let blankRight = isBlank;
				if(blankRight){
					const {width, y} = this.page;
					for(let i = this.page.x; i < width; ++i){
						const cell = this.page.data[y][i];
						if(cell && cell[0] && cell[0] !== " "){
							blankRight = false;
							break;
						}
					}
					if(blankRight) this.page.write(" ".repeat(cols));
					else           this.page.x += cols;
				}
				else this.page.x += cols;
			}
		}
	}
	
			
	moveByY(data){
		this.page.y += Math.floor(data / this.res[2]);
	}
	
	
	
	setColour(mode, args = []){
		switch(mode){
			default:
				this.page.colour = -1;
				break;
			case "c":
			case "k":
				args = args.map(a => Math.round(a / 65536));
				this.page.colourByCMYK(...args);
				break;
			case "r":
				args = args.map(a => Math.round(a / 257));
				this.page.colourByRGB(...args);
				break;
			case "g":
				this.page.colourByGrey(Math.round(args[0] / 257));
				break;
		}
	}


	setFont(index){
		this.page.font = this.fonts[index];
	}
	
	
	printText(data){
		this.page.write(data);
	}
	
	
	printTrackedText(spacing, text){
		spacing /= this.res[1];
		text = text.split("");
		
		const origin = this.page.x;
		let total    = this.xFraction || 0;
		
		for(const char of text){
			this.page.write(char);
			total += spacing + 1;
			this.page.x = origin + Math.floor(total);
			this.xFraction = total % 1;
		}
	}
}


module.exports = TTYDevice;
