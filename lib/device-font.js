"use strict";

const fs = require("fs");
const DeviceGlyph = require("./device-glyph.js");


class DeviceFont{
	
	constructor(descPath){
		this.path = descPath;
		this.loadDesc(descPath);
	}
	
	
	loadDesc(path){
		let data = fs.readFileSync(path, "utf8")
			.replace(/^(?:#[^\n]*\n)+/, data => {
				const fullName   = data.match(/^#\s+FullName\s+([^\n]+)$/m);
				const familyName = data.match(/^#\s+FamilyName\s+([^\n]+)$/m);
				const version    = data.match(/^#\s+Version\s+([^\n]+)$/m);
				if(fullName)     this.fullName   = fullName[1].trim();
				if(familyName)   this.familyName = familyName[1].trim();
				if(version)      this.version    = version[1].trim();
				return "";
			})
			.replace(/^\s*\n/gm, "")
			.split(/^(?=kernpairs$|charset$)/m);
		
		let props, kernPairs, charset;
		for(const block of data){
			const lines = block.trim().split(/\n/);
			const [firstLine, ...body] = lines;
			
			switch(firstLine){
				case "kernpairs":
					kernPairs = body;
					break;
				case "charset":
					charset = body;
					break;
				default:
					props = lines;
					break;
			}
		}
		
		for(let prop of props){
			prop = prop.split(/\s+/);
			let [name, ...args] = prop;
			switch(name){
				case "name":         this.name         = args[0]; break;
				case "internalname": this.internalName = args[0]; break;
				case "ligatures":    this.ligatures    = args.filter(a => "0" !== a); break;
				case "slant":        this.slant        = +args[0] || 0; break;
				case "spacewidth":   this.spaceWidth   = +args[0] || 0; break;
				case "special":      this.special      = true; break;
				default:
					name = name
						.replace(/^(\w+)name$/, "$1Name")
						.replace(/^pcl([a-z])(\w+)$/, (_,a,b) => `pcl${a.toUpperCase()}${b}`);
					args = args.map(a => /^\d+$/.test(a) ? +a : a);
					switch(args.length){
						case 0:  this[name] = true;    break;
						case 1:  this[name] = args[0]; break;
						default: this[name] = args;    break;
					}
			}
		}
		
		if(charset){
			const chars = new Map();
			let currentGlyph = null;
			for(const line of charset){
				const [name, ...args] = line.replace(/\s+--(?:[^-].*)?$/, "").split(/\s+/);
				if(null !== currentGlyph && '"' === args[0]){
					currentGlyph.names.push(name);
					chars.set(name, currentGlyph);
				}
				else{
					currentGlyph = new DeviceGlyph(name, ...args);
					chars.set(name, currentGlyph);
				}
			}
			this.charMap = chars;
		}
		
		if(kernPairs){
			const pairs = new Map();
			for(let line of kernPairs){
				line = line.split(/\s+/);
				const A = this.charMap.get(line[0]);
				const B = this.charMap.get(line[1]);
				const Δ = +line[2] || 0;
				!pairs.has(A)
					? pairs.set(A, new Map([ [B, Δ] ]))
					: pairs.get(A).set(B, Δ);
			}
			this.kerningPairs = pairs;
		}
	}
}

Object.assign(DeviceFont.prototype, {
	charMap: null,
	fullName: "",
	familyName: "",
	internalName: "",
	kerningPairs: null,
	ligatures: [],
	name: "",
	pfaFile: "",
	slant: 0,
	spaceWidth: 0,
	special: false,
	version: "",
});

module.exports = DeviceFont;
