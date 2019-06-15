"use strict";

describe("Environment shims", () => {
	describe("readFile()", () => {
		const {readFile} = require("..");
		const fs = require("fs");
		
		it("reads asynchronously", () =>
			expect(readFile(__filename)).to.be.an.instanceOf(Promise));
		
		it("returns UTF-8 text by default", async () => {
			const loadedByNode = fs.readFileSync(__filename, "utf8");
			const loadedByShim = await readFile(__filename);
			expect(loadedByShim).to.equal(loadedByNode);
		});
		
		it("returns binary when `raw` is set", async () => {
			const loadedByNode = fs.readFileSync(__filename);
			const loadedByShim = await readFile(__filename, true);
			expect(loadedByShim).to.eql(loadedByNode);
		});
	});

	describe("resolvePath()", () => {
		const {resolvePath} = require("..");
		const path = require("path");
		
		it("returns the path to a packaged file", async () => {
			const resolveByNode = path.resolve(__dirname, "../lib/index.js");
			const resolveByShim = await resolvePath("index.js");
			expect(resolveByShim).to.equal(resolveByNode);
		});
	});
});
