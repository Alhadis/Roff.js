#!/usr/local/bin/node --es_staging
"use strict";

const parseTTY = require("./lib/parse-tty.js");

const input = require("fs").readFileSync(__dirname + "/fixtures/tbl.ditroff").toString();
const output = parseTTY(input);

console.log(output);
