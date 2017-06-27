#!/usr/local/bin/node --es_staging
"use strict";

const fs     = require("fs");
const path   = require("path");
const render = require("./renderer.js");
const files  = process.argv.slice(2);

if(!files.length){
	const name = path.basename(process.argv[1]);
	const [B, N, U, u] = process.stderr.isTTY
		? ["\x1B[1m", "\x1B[0m", "\x1B[4m", "\x1B[24m"]
		: new Array(4).fill("");
	process.stderr.write(`${B}Error:${N} Need at least one file to test.\n`);
	process.stderr.write(`${B}Usage:${N} ${name} ${U}/path/to/file.out${u}\n`);
	process.exit(1);
}

for(let filePath of files){
	const input  = fs.readFileSync(path.resolve(filePath)).toString();
	const start  = Date.now();
	const output = render(input);
	const end    = Date.now();

	process.stdout.isTTY
		? process.stdout.write(htmlToTTY(output.replace(/\s+$/, "")))
		: process.stdout.write(output);

	process.stdout.write("\n");
	process.stderr.write(`Time: ${end - start}ms\n`);
}

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
		.replace(/<a[^>]+>|<\/a>/g, "")
		.replace(/&lt;/g,  "<")
		.replace(/&gt;/g,  ">")
		.replace(/&amp;/g, "&")
		.replace(/&#(\d+);/g, (_,c) => String.fromCharCode(c));
}
