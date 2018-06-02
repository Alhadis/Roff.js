"use strict";

const fs        = require("fs");
const {join}    = require("path");
const {expect}  = require("chai");
const htmlTTY   = new (require("../lib/postproc/html-tty.js"));

const read = (fixtureFile) =>
	fs.readFileSync(join(__dirname, "fixtures", fixtureFile), "utf8");
const when = (event, fn) =>
	describe(`when ${event}`, fn);


describe("HTMLTTY", () => {
	const [tmplHeader, tmplFooter] = read("template.html").trim().split(/\n+/);

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
		for(const manpage of ["groff_char(7)", "perlre(1)"]){
			it(`formats ${manpage} correctly`, () => {
				const source   = read(manpage.replace(/\(|\)/g, ".") + "out");
				const expected = read(manpage.replace(/\(|\)/g, ".") + "html");
				const result   = [tmplHeader, htmlTTY.process(source), tmplFooter, ""].join("\n");
				expect(result).to.eql(expected);
			});
		}
		
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
	
	describe("Raw nroff(1) output", () => {
		when("encountering a backspace", () =>
			it("moves one column left", () =>
				expect(htmlTTY.process("ABC\bZ", true)).to.eql("ABZ\n")));

		when("encountering multiple backspaces", () =>
			it("moves several columns left", () =>
				expect(htmlTTY.process("ABC\b\b23", true)).to.eql("A23\n")));

		when("encountering a space", () =>
			it("moves one column right", () =>
				expect(htmlTTY.process("ABC\b\b 23", true)).to.eql("AB23\n")));

		when("encountering multiple spaces", () =>
			// it.says("Use a tab, you pussy");
			it("moves multiple columns right", () =>
				expect(htmlTTY.process("ABC\b\b\b  23", true)).to.eql("AB23\n")));

		when("encountering a horizontal tab", () =>
			it("advances to the next tabstop", () =>
				expect(htmlTTY.process("\tABC\tXYZ", true)).to.eql("        ABC     XYZ\n")));

		when("encountering a vertical tab", () =>
			it("treats it like a reverse line feed", () =>
				expect(htmlTTY.process("ABC\n\vXYZ", true)).to.eql("XYZ\n")));

		when("encountering a form-feed", () =>
			it("treats it like a line terminator", () => {
				const source   = "Hello,\fworld.\nGoodbye,\f\fworld.\n";
				const expected = "Hello,\n      world.\nGoodbye,\n\n        world.\n";
				expect(htmlTTY.process(source, true)).to.eql(expected);
			}));
		
		when("overstriking a character", () => {
			it("embolds it if the characters match", () =>
				expect(htmlTTY.process("AB\bBC", true)).to.eql("A<b>B</b>C\n"));
			it("underlines it if one character is an underscore", () => {
				expect(htmlTTY.process("AB\b_C", true)).to.eql("A<u>B</u>C\n");
				expect(htmlTTY.process("A_\bBC", true)).to.eql("A<u>B</u>C\n");
			});
		});
		
		when("processing tbl(1) markup", () => {
			it("formats it correctly", () => {
				const source   = read("teletype.txt");
				const expected = read("teletype.html");
				const result   = [
					tmplHeader,
					htmlTTY.process(source, true),
					tmplFooter, ""
				].join("\n");
				expect(result).to.eql(expected);
			});
		});
	});
});
