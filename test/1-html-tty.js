"use strict";

const fs        = require("fs");
const {join}    = require("path");
const {expect}  = require("chai");
const htmlTTY   = new (require("../lib/postproc/html-tty.js"));

const read = (fixtureFile) =>
	fs.readFileSync(join(__dirname, "fixtures", fixtureFile), "utf8");


describe("HTMLTTY", () => {
	describe("Basic procedures", () => {
		it("prints text with track-kerning", () => {
			const source   = read("text-tracking.out");
			const expected = read("text-tracking.txt");
			expect(htmlTTY.process(source) + "\n").to.eql(expected);
		});
		
		it("draws horizontal and vertical lines", () => {
			const source   = read("boxes.out");
			const expected = read("boxes.txt");
			expect(htmlTTY.process(source) + "\n").to.eql(expected);
		});
	});
	
	describe("Manpage formatting", () => {
		const [tmplHeader, tmplFooter] = read("template.html").trim().split(/\n+/);
		
		for(const manpage of ["groff_char(7)", "perlre(1)"]){
			it(`formats ${manpage} correctly`, () => {
				const source   = read(manpage.replace(/\(|\)/g, ".") + "out");
				const expected = read(manpage.replace(/\(|\)/g, ".") + "html");
				const result   = [tmplHeader, htmlTTY.process(source), tmplFooter, ""].join("\n");
				expect(result).to.eql(expected);
			});
		}
		
		it("formats raw nroff(1) output correctly", () => {
			const source   = read("teletype.txt");
			const expected = read("teletype.html");
			const result   = [tmplHeader, htmlTTY.process(source, true), tmplFooter, ""].join("\n");
			expect(result).to.eql(expected);
		});
		
		it("can be used as a command-line postprocessor", () => {
			return new Promise((resolve, reject) => {
				const {exec} = require("child_process");
				const cmd    = "groff -Tutf8 -Z -man test/fixtures/groff.1 | bin/html-tty";
				const cwd    = require("path").resolve(join(__dirname, ".."));
				exec(cmd, {cwd}, (error, stdout, stderr) => {
					if(error){
						stderr && console.error(stderr);
						reject(error);
					}
					else{
						expect(stdout).not.to.be.empty;
						expect(stdout).to.include(
							"<b>groff</b> [<b>-abcegijklpstzCEGNRSUVXZ</b>]"
							+ " [<b>-d</b> <u>cs</u>] [<b>-D</b> <u>arg</u>]"
							+ " [<b>-f</b> <u>fam</u>] [<b>-F</b> <u>dir</u>]"
						);
						resolve();
					}
				});
			});
		});
	});
});
