#!/usr/local/bin/node --es_staging
"use strict";

const fs = require("fs");
const input = fs.readFileSync("./fixtures/man.ditroff").toString();

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
