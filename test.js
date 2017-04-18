#!/usr/local/bin/node --es_staging
"use strict";

const parseTTY = require("./lib/parse-tty.js");

const input = require("fs").readFileSync(__dirname + "/fixtures/groff_char.ditroff").toString();

const start = Date.now();
const output = parseTTY(input);
const end = Date.now();

if(process.stdout.isTTY)
	console.log(htmlToTTY(output));
else
	console.log(output);

console.warn(`Time: ${end - start}ms`);

function htmlToTTY(input){
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
		.replace(/&lt;/g,  "<")
		.replace(/&gt;/g,  ">")
		.replace(/&amp;/g, "&")
		.replace(/&#(\d+);/g, (_,c) => String.fromCharCode(c));
}
