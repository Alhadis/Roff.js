#!/usr/bin/env node --es_staging
"use strict";

const DeviceDriver = require("./lib/device-driver.js");

const PostScript = new DeviceDriver("/usr/local/share/groff/current/font/devps");
const HTML       = new DeviceDriver("/usr/local/share/groff/current/font/devhtml");

console.log(PostScript);
