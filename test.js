#!/usr/local/bin/node --es_staging
"use strict";

const TextGrid = require("./lib/text-grid.js");
let t = new TextGrid()
	.write("Lorem ipsum ")
	.write("dolor sit amet");
console.log(t.toString());
process.exit(0);

const fs = require("fs");
const input = fs.readFileSync("./fixtures/tbl.ditroff").toString();

const {tokenise, ttyToHTML} = require("./lib/tokeniser.js");
const html = ttyToHTML(tokenise(input));
console.log(htmlToTTY(html));

function htmlToTTY(input){
	return input
		.replace(/^\n+/,   "")
		.replace(/<b>/g,   "\x1B[1m")
		.replace(/<u>/g,   "\x1B[4m")
		.replace(/<\/b>/g, "\x1B[22m")
		.replace(/<\/u>/g, "\x1B[24m")
		.replace(/&#(\d+);/g, (_,c) => String.fromCharCode(c));
}
