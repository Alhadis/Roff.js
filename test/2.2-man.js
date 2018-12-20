"use strict";

const {ManAdapter} = require("..");
const {existsSync, statSync} = require("fs");
const {spawnSync} = require("child_process");
const {join} = require("path");


function discretionaryTest(title, dependsOn, handler){
	const skip = reason => describe.skip(`${title} (skipped: ${reason})`, handler);
	if("win32" === process.platform)
		return skip("running Windows, man(1) NIH");
	try{
		let {status, stdout} = spawnSync("command", ["-v", dependsOn]);
		if(!status && ([stdout] = String(stdout).trim().split("\n"))){
			const file = statSync(stdout);
			if(0o111 & file.mode && file.isFile())
				return describe(title, handler);
		}
	}
	catch(e){ }
	return skip(`${dependsOn} not installed`);
}

// Load a fixture file as though it were a man-page
async function load(file){
	const path = join(__dirname, "fixtures", "man", file);
	expect(existsSync(path)).to.be.true;
	expect(statSync(path).isFile()).to.be.true;
	try{ return await new ManAdapter().load(path); }
	catch(e){ return e; }
}

describe("ManAdapter", () => {
	describe("File loading", () => {
		const ascii = ".TH NAME 1\n.SH SYNOPSIS\nprogram\n";
		const utf8  = "“TEXT’S BEEN ‘QUOTED’…”\nlit 😂👌 boi\nA䝞¥Z\n";
		const failedExec = value => (value instanceof Error)
			&& "ExecutionError" === value[Symbol.toStringTag]
			&& "object" === typeof value.executable
			&& "string" === typeof value.executable.name
			&& Array.isArray(value.executable.args);
		
		describe("Plain text", () => {
			it("loads plain ASCII text", async () => expect(await load("text-ascii.txt")).to.equal(ascii));
			it("loads plain UTF8 text",  async () => expect(await load("text-utf8.txt")).to.equal(utf8));
			it("loads empty files",      async () => expect(await load("text-empty.txt")).to.equal(""));
		});
		
		describe("Gzipped data", () => {
			it("decompresses gzipped ASCII", async () => expect(await load("gzip-ascii.gz")).to.equal(ascii));
			it("decompresses gzipped UTF8",  async () => expect(await load("gzip-utf8.gz")).to.equal(utf8));
			it("rejects invalid gzip data",  async () => expect(await load("gzip-invalid.gz")).to.be.an("error"));
		});
		
		describe("zlib headers", () => {
			it("decompresses deflated ASCII", async () => expect(await load("zlib-ascii.zlib")).to.equal(ascii));
			it("decompresses deflated UTF8",  async () => expect(await load("zlib-utf8.zlib")).to.equal(utf8));
			it("rejects invalid data",        async () => expect(await load("zlib-invalid.zlib")).to.be.an("error"));
		});
		
		discretionaryTest("Bzipped data", "bzip2", () => {
			it("decompresses bzipped ASCII", async () => expect(await load("bzip-ascii.bz2")).to.equal(ascii));
			it("decompresses bzipped UTF8",  async () => expect(await load("bzip-utf8.bz2")).to.equal(utf8));
			it("rejects invalid bzip data",  async () => expect(await load("bzip-invalid.bz2")).to.satisfy(failedExec));
		});
		
		discretionaryTest("Standard Unix compress(1)", "uncompress", () => {
			it("decompresses compress'd ASCII", async () => expect(await load("compress-ascii.Z")).to.equal(ascii));
			it("decompresses compress'd UTF8",  async () => expect(await load("compress-utf8.Z")).to.equal(utf8));
			it("rejects badly compress'd data", async () => expect(await load("compress-invalid.Z")).to.satisfy(failedExec));
		});
		
		discretionaryTest("LZMA/XZ compressed data", "xz", () => {
			it("decompresses LZMA-compressed ASCII", async () => expect(await load("lzma-ascii.lzma")).to.equal(ascii));
			it("decompresses LZMA-compressed UTF8",  async () => expect(await load("lzma-utf8.lzma")).to.equal(utf8));
			it("rejects invalid LZMA compression",   async () => expect(await load("lzma-invalid.lzma")).to.satisfy(failedExec));
		});
		
		discretionaryTest("Lzipped data", "lzip", () => {
			it("decompresses lzipped ASCII", async () => expect(await load("lzip-ascii.lz")).to.equal(ascii));
			it("decompresses lzipped UTF8",  async () => expect(await load("lzip-utf8.lz")).to.equal(utf8));
			it("rejects invalid lzip data",  async () => expect(await load("lzip-invalid.lz")).to.satisfy(failedExec));
		});
		
		discretionaryTest("LRZIP", "lrzip", () => {
			it("decompresses lrzipped ASCII", async () => expect(await load("lrzip-ascii.lrz")).to.equal(ascii));
			it("decompresses lrzipped UTF8",  async () => expect(await load("lrzip-utf8.lrz")).to.equal(utf8));
			it("rejects invalid lrzip data",  async () => expect(await load("lrzip-invalid.lrz")).to.satisfy(failedExec));
		});
		
		discretionaryTest("LZ4 compressed data", "lz4", () => {
			it("decompresses LZ4 v1.4+ ASCII", async () => expect(await load("lz4-v1.4-ascii.lz4")).to.equal(ascii));
			it("decompresses LZ4 v1.4+ UTF8",  async () => expect(await load("lz4-v1.4-utf8.lz4")).to.equal(utf8));
			it("rejects an invalid LZ4 file",  async () => expect(await load("lz4-v1.4-invalid.lz4")).to.satisfy(failedExec));
			
			// Legacy LZ4 files generated from an LZ4 build compiled @ 647baabcef0effcf
			it("decompresses legacy LZ4 ASCII", async () => expect(await load("lz4-v1.3-ascii.lz4")).to.include(ascii));
			it("decompresses legacy LZ4 UTF8",  async () => expect(await load("lz4-v1.3-utf8.lz4")).to.include(utf8));
			// We can't test invalidity here; old LZ4 files never trigger an error code, even if corrupt/incomplete…
		});
		
		discretionaryTest("Facebook's Zstandard", "zstd", () => {
			it("decompresses ZSTD-compressed ASCII", async () => expect(await load("zstd-ascii.zst")).to.equal(ascii));
			it("decompresses ZSTD-compressed UTF8",  async () => expect(await load("zstd-utf8.zst")).to.equal(utf8));
			it("rejects invalid ZSTD compression",   async () => expect(await load("zstd-invalid.zst")).to.satisfy(failedExec));
		});
		
		discretionaryTest("QuickLZ", "qpress", () => {
			it("decompresses qzipped ASCII", async () => expect(await load("qpress-ascii.qp")).to.equal(ascii));
			it("decompresses qzipped UTF8",  async () => expect(await load("qpress-utf8.qp")).to.equal(utf8));
			it("rejects invalid qzip data",  async () => expect(await load("qpress-invalid.qp")).to.satisfy(failedExec));
		});
		
		discretionaryTest("Apple's LZFSE", "lzfse", () => {
			it("decompresses LZFSE-compressed ASCII", async () => expect(await load("lzfse-ascii.lzfse")).to.equal(ascii));
			it("decompresses LZFSE-compressed UTF8",  async () => expect(await load("lzfse-utf8.lzfse")).to.equal(utf8));
			it("rejects invalid LZFSE compression",   async () => expect(await load("lzfse-invalid.lzfse")).to.satisfy(failedExec));
		});
	});
});
