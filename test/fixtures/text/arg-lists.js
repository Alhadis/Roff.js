#!/usr/bin/env node
"use strict";

/**
 * @fileoverview Compare output of {@link parseRoffArgs} against
 * `nroff arg-lists.roff | sed -e :a -e '/^\n*$/{$d;N;};/\n$/ba'`
 */

const {parseRoffArgs} = require("../../../lib/index.js");
const {readFileSync} = require("fs");

readFileSync("arg-lists.roff", "utf8")
	.match(/^\.BI\s+(\S.*)$/gm)
	.map(test => test.replace(/^\.BI\s+/, ""))
	.map(test => {
		let i = 0;
		for(const arg of parseRoffArgs(test))
			process.stdout.write(`\x1B[${(i++ % 2) ? 4 : 1}m${arg}\x1B[0m`);
		process.stdout.write("\n");
	});
