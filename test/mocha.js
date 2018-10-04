const Mocha   = require("mocha");
const Chai    = require("chai");
global.expect = Chai.expect;

(async () => {
	"use strict";
	const {readdirSync} = await import("fs");
	const files = readdirSync(__dirname).filter(name => /\.mjs$/.test(name));
	await Promise.all(files.map(file => import(`./${file}`)));
	run();
})();
