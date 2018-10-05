"use strict";

const fs            = require("fs");
const path          = require("path");
const {exec}        = require("child_process");
const {expect}      = require("chai");
const {TTYRenderer} = require("../");
const htmlTTY       = new TTYRenderer();

const read = (fixtureFile) =>
	fs.readFileSync(path.join(__dirname, "fixtures", "text", fixtureFile), "utf8");


describe("TTYRenderer", () => {
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
				const cmd    = "groff -Tutf8 -Z -man test/fixtures/text/groff.1 | bin/html-tty";
				const cwd    = path.resolve(path.join(__dirname, ".."));
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
		it("moves left when encountering backspaces", () => {
			expect(htmlTTY.process("ABC\bZ", true)).to.eql("ABZ\n");
			expect(htmlTTY.process("ABC\b\b23", true)).to.eql("A23\n");
		});
		
		it("moves right when encountering spaces", () => {
			expect(htmlTTY.process("ABC\b\b 23", true)).to.eql("AB23\n");
			expect(htmlTTY.process("ABC\b\b\b  23", true)).to.eql("AB23\n");
		});

		it("advances to the next tabstop when parsing a tab", () =>
			expect(htmlTTY.process("\tABC\tXYZ", true)).to.eql("        ABC     XYZ\n"));

		it("interprets vertical tabs as reverse line feeds", () =>
			expect(htmlTTY.process("ABC\n\vXYZ", true)).to.eql("XYZ\n"));

		it("interprets form-feeds as line terminators", () => {
			const source   = "Hello,\fworld.\nGoodbye,\f\fworld.\n";
			const expected = "Hello,\n      world.\nGoodbye,\n\n        world.\n";
			expect(htmlTTY.process(source, true)).to.eql(expected);
		});
		
		it("embolds matching overstrike characters", () =>
			expect(htmlTTY.process("AB\bBC", true)).to.eql("A<b>B</b>C\n"));
		
		it("underlines characters when overstriking an underscore", () => {
			expect(htmlTTY.process("AB\b_C", true)).to.eql("A<u>B</u>C\n");
			expect(htmlTTY.process("A_\bBC", true)).to.eql("A<u>B</u>C\n");
		});

		it("formats tbl(1) markup correctly", () => {
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
