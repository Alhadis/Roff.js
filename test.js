#!/usr/bin/env node --es_staging
"use strict";

const TTYCanvas = require("./lib/tty-canvas.js");
let t;

t = new TTYCanvas()
	.drawLine(20, 0)
	.drawLine(20, 20)
	.up()
	.drawLine(20, 0)
	.drawLine(0, 2)
	.drawLine(-2, 2)
	.up()
	.drawLine(-44, 0)
	.drawLine(0, -3)
	.drawLine(20, -20)
	.drawLine(5)
	.left()
	.drawLine(0, 2)
	.drawLine(-19, 19)
	.drawLine(17, 0)
	.drawLine(-25, -25)
console.log(t.toString());

t = new TTYCanvas()
	.draw([
		[20,  0],
		[20,  20],
		[20,  0],
		[0,   2],
		[-2,  2],
		[-44, 0],
		[0,  -3],
		[20, -20],
		[4,   0],
		[0,   2],
		[-20, 20],
		[17,  0],
		[-25, -25],
	]);

console.log(t.toString());
