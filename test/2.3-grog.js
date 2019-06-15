"use strict";

const {GrogAdapter} = require("..");

describe("GrogAdapter", () => {
	let grog = null;
	before("Constructing adapter instance", () => grog = new GrogAdapter());
	
	describe("guessOptions()", () => {
		it("recognises macro packages", async () => {
			expect(await grog.guessOptions(".TH TITLE")).to.eql([["groff", "-man",  "-Tps"]]);
			expect(await grog.guessOptions(".Dd $Date")).to.eql([["groff", "-mdoc", "-Tps"]]);
			expect(await grog.guessOptions(".bx"))      .to.eql([["groff", "-me",   "-Tps"]]);
			expect(await grog.guessOptions(".AE"))      .to.eql([["groff", "-mm",   "-Tps"]]);
			expect(await grog.guessOptions(".LH"))      .to.eql([["groff", "-ms",   "-Tps"]]);
		});
		it("recognises preprocessor blocks", async () => {
			expect(await grog.guessOptions(".EQ\n.EE")).to.eql([["groff", "-e", "-Tps"]]);
			expect(await grog.guessOptions(".PS\n.PE")).to.eql([["groff", "-p", "-Tps"]]);
			expect(await grog.guessOptions(".TS\n.TE")).to.eql([["groff", "-t", "-Tps"]]);
		});
		it("recognises preprocessor option headers", async () => {
			expect(await grog.guessOptions("'\\\" e")).to.eql([["groff", "-e", "-Tps"]]);
			expect(await grog.guessOptions("'\\\" p")).to.eql([["groff", "-p", "-Tps"]]);
			expect(await grog.guessOptions("'\\\" t")).to.eql([["groff", "-t", "-Tps"]]);
		});
		it("ignores user-defined macros", async () => {
			expect(await grog.guessOptions(".de TH\n..\n.TH TITLE")).to.eql([["groff", "-Tps"]]);
			expect(await grog.guessOptions(".TH TITLE\n.de TH\n..")).to.eql([["groff", "-man", "-Tps"]]);
		});
	});
	
	describe("splitPipeline()", () => {
		it("parses single commands", () => {
			expect(grog.splitPipeline("groff"))       .to.eql([["groff"]]);
			expect(grog.splitPipeline(" groff"))      .to.eql([["groff"]]);
			expect(grog.splitPipeline("groff "))      .to.eql([["groff"]]);
			expect(grog.splitPipeline("groff\n"))     .to.eql([["groff"]]);
			expect(grog.splitPipeline("\n\ngroff"))   .to.eql([["groff"]]);
			expect(grog.splitPipeline("  groff \n ")) .to.eql([["groff"]]);
		});
		it("parses single arguments", () => {
			expect(grog.splitPipeline("groff -Tps"))   .to.eql([["groff", "-Tps"]]);
			expect(grog.splitPipeline("groff  -Tps ")) .to.eql([["groff", "-Tps"]]);
			expect(grog.splitPipeline(" groff\n-Tps")) .to.eql([["groff", "-Tps"]]);
		});
		it("parses multiple arguments", () => {
			expect(grog.splitPipeline("groff -Tps -Z"))       .to.eql([["groff", "-Tps", "-Z"]]);
			expect(grog.splitPipeline("groff  -Tps  -Z"))     .to.eql([["groff", "-Tps", "-Z"]]);
			expect(grog.splitPipeline(" groff  -Tps -Z  "))   .to.eql([["groff", "-Tps", "-Z"]]);
			expect(grog.splitPipeline(" groff \n-Tps  \t-Z")) .to.eql([["groff", "-Tps", "-Z"]]);
		});
		it("parses multiple commands",  () => {
			expect(grog.splitPipeline("tbl | groff"))         .to.eql([["tbl"], ["groff"]]);
			expect(grog.splitPipeline("tbl|groff"))           .to.eql([["tbl"], ["groff"]]);
			expect(grog.splitPipeline("tbl | eqn | groff"))   .to.eql([["tbl"], ["eqn"], ["groff"]]);
			expect(grog.splitPipeline("tbl|eqn|groff"))       .to.eql([["tbl"], ["eqn"], ["groff"]]);
		});
		it("parses multiple commands and arguments", () => {
			expect(grog.splitPipeline("eqn | groff -C"))             .to.eql([["eqn"],             ["groff", "-C"]]);
			expect(grog.splitPipeline("eqn -C | groff"))             .to.eql([["eqn", "-C"],       ["groff"]]);
			expect(grog.splitPipeline("eqn -C | groff -a"))          .to.eql([["eqn", "-C"],       ["groff", "-a"]]);
			expect(grog.splitPipeline("eqn -C -a | groff"))          .to.eql([["eqn", "-C", "-a"], ["groff"]]);
			expect(grog.splitPipeline("eqn  -C  -a  |  groff "))     .to.eql([["eqn", "-C", "-a"], ["groff"]]);
			expect(grog.splitPipeline("eqn -C -a | groff -a -b -z")) .to.eql([["eqn", "-C", "-a"], ["groff", "-a", "-b", "-z"]]);
			expect(grog.splitPipeline("eqn -C | groff -Z | grep -i")).to.eql([["eqn", "-C"], ["groff", "-Z"], ["grep", "-i"]]);
		});
		it("preserves quoted regions", () => {
			expect(grog.splitPipeline("groff '-m doc'")).to.eql([["groff", "-m doc"]]);
			expect(grog.splitPipeline('groff "-m doc"')).to.eql([["groff", "-m doc"]]);
			expect(grog.splitPipeline("'groff  \n doc'")).to.eql([["groff  \n doc"]]);
		});
		it("understands escape sequences", () => {
			expect(grog.splitPipeline("groff -m\\ doc"))  .to.eql([["groff", "-m doc"]]);
			expect(grog.splitPipeline("groff -m\\\\ doc")).to.eql([["groff", "-m\\", "doc"]]);
			expect(grog.splitPipeline("eqn \\| groff"))   .to.eql([["eqn", "|", "groff"]]);
			expect(grog.splitPipeline("eqn \\\\|groff"))  .to.eql([["eqn", "\\"], ["groff"]]);
			expect(grog.splitPipeline("eqn\\\n|groff"))   .to.eql([["eqn\n"], ["groff"]]);
		});
	});
});
