#!/usr/local/bin/node --es_staging
"use strict";

const fs        = require("fs");
const path      = require("path");
const TTYDevice = require("../lib/devices/tty.js");
const files     = process.argv.slice(2);

if(!files.length){
	const name = path.basename(process.argv[1]);
	const [B, N, U, u] = process.stderr.isTTY
		? ["\x1B[1m", "\x1B[0m", "\x1B[4m", "\x1B[24m"]
		: new Array(4).fill("");
	process.stderr.write(`${B}Error:${N} Need at least one file to test.\n`);
	process.stderr.write(`${B}Usage:${N} ${name} ${U}/path/to/file.out${u}\n`);
	process.exit(1);
}

const ttyDriver = new TTYDevice();

for(let filePath of files){
	const input  = fs.readFileSync(path.resolve(filePath)).toString();
	const start  = Date.now();
	const output = ttyDriver.parse(input);
	const end    = Date.now();
	ttyDriver.printOutput();
	process.stderr.write(`Time: ${end - start}ms\n`);
}
