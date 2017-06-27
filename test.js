#!/usr/bin/env node --es_staging
"use strict";

const fs = require("fs");
const data = fs.readFileSync("./fixtures/perlre.out", "utf8");

const OutputDevice = require("./lib/devices/tty.js");
const dev   = new OutputDevice();
const start = Date.now();
dev.parse(data);
const end   = Date.now();

console.warn(`Time: ${end - start}ms`);
