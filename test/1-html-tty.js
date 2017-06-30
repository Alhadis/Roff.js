"use strict";

const fs        = require("fs");
const {join}    = require("path");
const {expect}  = require("chai");
const htmlTTY   = require("../lib/postproc/html-tty.js");

const read = (fixtureFile) =>
	fs.readFileSync(join(__dirname, "fixtures", fixtureFile), "utf8");

describe("HTMLTTY", () => {
	const [tmplHeader, tmplFooter] = read("template.html").trim().split(/\n+/);
	
	for(const manpage of ["groff_char(7)", "perlre(1)"]){
		it(`formats ${manpage} correctly`, () => {
			const source   = read(manpage.replace(/\(|\)/g, ".") + "out");
			const expected = read(manpage.replace(/\(|\)/g, ".") + "html");
			const result   = [tmplHeader, htmlTTY.parse(source), tmplFooter, ""].join("\n");
			expect(result).to.eql(expected);
		});
	}
});
