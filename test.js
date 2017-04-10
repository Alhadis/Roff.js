#!/usr/local/bin/node --es_staging
"use strict";

const parseTTY = require("./lib/parse-tty.js");

const input = require("fs").readFileSync(__dirname + "/fixtures/tbl.ditroff").toString();

const start = Date.now();
const output = parseTTY(input);
const end = Date.now();

console.log(output);

console.log(`Time: ${end - start}ms`);
