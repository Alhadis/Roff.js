#!/usr/bin/env node --es_staging
"use strict";

const parseTTY = require("./lib/render-tty.js");
const input = require("fs").readFileSync(__dirname + "/fixtures/text-2.out").toString();

const output = parseTTY(input).trim();
console.log(output);
