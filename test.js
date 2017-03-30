#!/usr/local/bin/node --es_staging
"use strict";

const fs = require("fs");
const input = fs.readFileSync("./fixtures/simple.ditroff").toString();

const {tokenise, list} = require("./lib/tokeniser.js");
list(tokenise(input));
