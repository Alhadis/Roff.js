"use strict";

const charnames = require("./charnames.js");
const TextGrid  = require("./text-grid.js");
const {tokenise, tokenTypes} = require("./tokeniser.js");
const {toString} = String.prototype;


module.exports = function(text){
	const tokens = tokenise(text);
	return parseTTY(tokens);
};

function parseTTY(tokens){
	const fonts    = ["", "", "", ""];
	const res      = [240, 24, 40];
	let moved      = true;
	let output     = "";
	let page       = null;
	let ulMode     = 0;
	let fontTags   = [];
	let colourTags = [];
	
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
			
			case tokenTypes.BEGIN_PAGE:
				if(null !== page)
					output += renderHTML(page, fontTags, colourTags) + "\n";
				page = new TextGrid();
				fontTags = [];
				colourTags = [];
				break;
			
			case tokenTypes.CHAR_INDEXED:{
				const char = String.fromCharCode(+data);
				const {x, y} = page;
				page.write(char).moveTo(x, y);
				moved = false;
				break;
			}
			
			case tokenTypes.CHAR_LITERAL:{
				const {x, y} = page;
				page.write(data).moveTo(x, y);
				moved = false;
				break;
			}
			
			case tokenTypes.CHAR_NAMED:{
				const char = charnames[data];
				const {x, y} = page;
				page.write(char).moveTo(x, y);
				moved = false;
				break;
			}
			
			case tokenTypes.DRAWING:{
				const [type, ...args] = data.split(/\s+/);
				switch(type){
					case "l":
						page.draw([[+args[0] / res[1], +args[1] / res[2]]]);
						break;
				}
				moved = true;
				break;
			}
			
			case tokenTypes.MOVE_ABS_H:
				page.x = Math.floor(+data / res[1]);
				moved = true;
				break;
			
			case tokenTypes.MOVE_ABS_V:
				page.y = Math.floor(+data / res[2]);
				moved = true;
				break;
			
			case tokenTypes.MOVE_PRINT:{
				const [cols, char] = data.replace(/\s+/g, "").split(/(?=.$)/);
				page.x += Math.floor(+cols / res[1]);
				const {x, y} = page;
				page.write(char).moveTo(x, y);
				moved = false;
				break;
			}
			
			case tokenTypes.MOVE_REL_H:
				page.x += Math.floor(+data / res[1]);
				moved = true;
				break;
			
			case tokenTypes.MOVE_REL_V:
				page.y += Math.floor(+data / res[2]);
				moved = true;
				break;
			
			case tokenTypes.SET_COLOUR:
				colourTags.push([page.x, page.y, data]);
				break;
			
			case tokenTypes.SET_FONT:
				fontTags.push([page.x + (moved ? 0 : 1), page.y, fonts[data], ulMode]);
				break;
			
			case tokenTypes.TEXT_NORMAL:
			case tokenTypes.TEXT_TRACKED:
				page.write(data);
				moved = true;
				break;
		}
	}
	
	if(null !== page)
		output += renderHTML(page, fontTags, colourTags);
	
	return output;
}



function renderHTML(page, fonts, colours){
	applyTags(page, fonts, colours);
	return page.data.map(row => 
		row.map(cell => ("object" === typeof cell)
			? cell.toString()
			: escapeHTML(cell))
		.join(""))
	.join("\n")
	.replace(/^ +\n/, "")
	.replace(/(<[bu]>)(\s*)/g,   (_,a,b) => b + a)
	.replace(/(\s*)(<\/[bu]>)/g, (_,a,b) => b + a)
	.replace(/ +$/gm, "")
	.replace(/<(u|b)>([^<]+)<\/\1>/g, (_, tag, data) => {
		const openTag  = `<${tag}>`;
		const closeTag = `</${tag}>`;
		const pattern  = "u" === tag
			? /\s+/g
			: /\n\s+/g;
		data = data.replace(pattern, `${closeTag}$&${openTag}`);
		return openTag + data + closeTag;
	});
}


function applyTags(page, fonts, colours){
	const {data} = page;
	const {length} = fonts;
	
	for(let i = 0; i < length; ++i){
		const [startX, startY, ...attr] = fonts[i];
		const cell = markCell(data[startY], startX);
		const [openTag, closeTag] = getFontTags(...attr);
		cell.addOpeningTag(openTag);
		
		if(i < length - 1){
			let [endX, endY] = fonts[i+1];
			(0 === endX)
				? (--endY, endX = data.cols-1)
				:  --endX;
			
			const cell = markCell(data[endY], endX);
			cell.addClosingTag(closeTag);
		}
	}
}


function getFontTags(name, ulMode = 0){
	const m = 1 === ulMode ? " cu" : "";
	switch(name){
		default:   return ["",                   ""];
		case "I":  return [`<u${m}>`,        "</u>"];
		case "B":  return ["<b>",            "</b>"];
		case "BI": return [`<b><u${m}>`, "</u></b>"];
	}
}


function escapeHTML(input = ""){
	switch(input){
		case "<": return "&lt;";
		case ">": return "&gt;";
		case "&": return "&amp;";
		default:  return input || "";
	}
}


function markCell(row = [], index = 0){
	if("object" === typeof row[index])
		return row[index];
	
	const tag = new String(row[index] || "");
	tag.toString = function(){
		const data = escapeHTML(toString.call(this));
		return this.openTags.join("") + data + this.closeTags.join("");
	};
	tag.addOpeningTag = function(tag){ tag && this.openTags.unshift(tag); };
	tag.addClosingTag = function(tag){ tag && this.closeTags.push(tag); }
	tag.openTags      = [];
	tag.closeTags     = [];
	tag.index         = index;
	row[index]        = tag;
	return tag;
}
