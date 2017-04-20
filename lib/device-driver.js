"use strict";

const fs = require("fs");
const {join} = require("path");
const DeviceFont = require("./device-font.js");


class DeviceDriver{
	
	constructor(path){
		this.path = path;
		
		const size = [0, 0];
		Object.defineProperties(this, {
			paperSize: {
				get: () => size,
				set: to => {
					to = this.resolvePaperSize(to);
					if(null === to) return;
					size[0] = to[0];
					size[1] = to[1];
				}
			},
			paperLength: {
				get: () => size[1] || 0,
				set: to => size[1] = +to
			},
			paperWidth: {
				get: () => size[0] || 0,
				set: to => size[0] = +to
			},
		});
		
		this.files = fs.readdirSync(path);
		if(-1 === this.files.indexOf("DESC"))
			throw new ReferenceError(`Device description file not found`);
		this.loadDesc(join(path, "DESC"));
		
		if(-1 !== this.files.indexOf("download"))
			this.loadDownloads(join(path, "download"));
		
		this.fonts = new Map();
		this.mountedFonts = this.mountedFonts.map(f =>
			("0" === f) ? null : this.loadFont(f));
	}
	
		
	loadDesc(path){
		let data = fs.readFileSync(path, "utf8");
		
		const numFonts = +(data.match(/^fonts\s+(\d+)/m) || [0, -1])[1];
		const sizeLine = /(?:^|\n)sizes((?:\s+\d+(?:-\d+)?)+)\s+0[ \t]*(?:\n|$)/;
		const fontLine = new RegExp("(?:^|\\n)fonts\\s+\\d+((?:\\s+\\S+){" + numFonts + "})");
		const fontList = [];
		const sizeList = [];
		
		data = data
			.replace(sizeLine, (_, sizes) => {
				for(const size of sizes.trim().split(/\s+/))
					sizeList.push(-1 !== size.indexOf("-")
						? size.split(/-/).map(s => +s)
						: +size);
				return "\n";
			})
			.replace(fontLine, (_, fonts) => {
				fontList.push(...fonts.split(/\s+/).filter(Boolean));
				return "\n";
			})
			.replace(/\ncharset\s(?:\n|.)*$/, "");
		
		if(sizeList.length) this.sizes        = sizeList;
		if(fontList.length) this.mountedFonts = fontList;
		
		for(const line of data.split(/\n+/).filter(Boolean)){
			const [name, ...args] = line.split(/\s+/);
			
			switch(name){
				case "image_generator":          this.imageGenerator =  args[0]; break;
				case "paperlength":              this.paperLength    = +args[0]; break;
				case "papersize":                this.paperSize      =  args[0]; break;
				case "paperwidth":               this.paperWidth     = +args[0]; break;
				case "pass_filenames":           this.passFilenames  =     true; break;
				case "sizescale":                this.sizeScale      = +args[0]; break;
				case "tcommand":                 this.tcommand       =     true; break;
				case "unitwidth":                this.unitWidth      = +args[0]; break;
				case "unicode":                  this.unicode        =     true; break;
				case "unscaled_charwidths":      this.unscaledChars  =     true; break;
				case "use_charnames_in_special": this.useCharNames   =     true; break;
				case "X11":                      this.x11            =     true; break;
				case "res":
				case "hor":
				case "vert":
				case "broken":
					this[name] = +args[0];
					break;
				case "print":
				case "prepro":
				case "postpro":
				case "family":
					this[name] = args[0];
					break;
				case "styles":
					this.styles = args;
					break;
			}
		}
	}
	
	
	loadDownloads(path){
		this.downloads = new Map();
		const data = fs.readFileSync(path, "utf8")
			.replace(/^(?:#[^\n]*\n)+/, "")
			.split(/\n+/)
			.filter(Boolean);
		for(const line of data){
			const [psName, fileName] = line.trim().split(/\s+/);
			this.downloads.set(psName, fileName);
		}
	}
	
	
	loadFont(name){
		let font = this.fonts.get(name);
		if(font)
			return font;
		
		if(-1 === this.files.indexOf(name))
			return null;
		
		font = new DeviceFont(join(this.path, name));
		this.fonts.set(name, font);
		
		if(null !== this.downloads){
			const {internalName} = font;
			const pfaFile = this.downloads.get(internalName);
			if(pfaFile)
				font.pfaFile = join(this.path, pfaFile);
		}
		
		return font;
	}
	
	
	mountFont(index, name){
		index = +index || 0;
		const font = this.loadFont(name);
		this.mountedFonts[index] = font;
		return font;
	}
	
	
	resolvePaperSize(input){
		switch(input.toUpperCase()){
			// ISO paper-sizes
			case "A0":        return [841,  1189];
			case "A1":        return [594,  841];
			case "A2":        return [420,  594];
			case "A3":        return [297,  420];
			case "A4":        return [210,  297];
			case "A5":        return [148,  210];
			case "A6":        return [105,  148];
			case "A7":        return [74,   105];
			case "B0":        return [1000, 1414];
			case "B1":        return [707,  1000];
			case "B2":        return [500,  707];
			case "B3":        return [353,  500];
			case "B4":        return [250,  353];
			case "B5":        return [176,  250];
			case "B6":        return [125,  176];
			case "B7":        return [88,   125];
			case "C0":        return [917,  1297];
			case "C1":        return [648,  917];
			case "C2":        return [458,  648];
			case "C3":        return [324,  458];
			case "C4":        return [229,  324];
			case "C5":        return [162,  229];
			case "C6":        return [114,  162];
			case "C7":        return [81,   114];
			case "D0":        return [771,  1090];
			case "D1":        return [545,  771];
			case "D2":        return [385,  545];
			case "D3":        return [272,  385];
			case "D4":        return [192,  272];
			case "D5":        return [136,  192];
			case "D6":        return [96,   136];
			case "D7":        return [68,   96];
			case "DL":        return [110,  220];
			
			// US paper-sizes
			case "LETTER":    return [216, 279];
			case "LEGAL":     return [216, 356];
			case "TABLOID":   return [279, 432];
			case "LEDGER":    return [432, 279];
			case "STATEMENT": return [139, 216];
			case "EXECUTIVE": return [184, 267];
			case "COM10":     return [105, 241];
			case "MONARCH":   return [98,  191];
		}
		
		const units = {
			i: 25.4,   // Inch
			c: 10,     // Centimetre
			p: 0.353,  // Point
			P: 4.2333, // Pica
		};
		const customSize = input.match(/^([\d.]+)([icpP]),([\d.]+)([icpP])$/);
		if(customSize){
			const length = +customSize[1] * units[customSize[2]];
			const width  = +customSize[3] * units[customSize[4]];
			return [width, length];
		}
		
		return null;
	}
}

Object.assign(DeviceDriver.prototype, {
	broken: 0,
	downloads: null,
	family: "",
	files: null,
	fonts: null,
	hor: 0,
	imageGenerator: "",
	mountedFonts: null,
	passFilenames: false,
	postpro: "",
	prepro: "",
	print: "",
	res: 0,
	sizes: null,
	sizeScale: 1,
	tcommand: false,
	unicode: false,
	unitWidth: 0,
	unscaledChars: false,
	useCharNames: false,
	vert: 0,
	x11: false,
});

module.exports = DeviceDriver;
