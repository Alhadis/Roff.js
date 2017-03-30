#!/usr/local/bin/node --es_staging
"use strict";

const fs = require("fs");
const input = fs.readFileSync("classical.ditroff").toString();

const {tokenise, list} = require("./tokenise-ditroff.js");
list(tokenise(input));
