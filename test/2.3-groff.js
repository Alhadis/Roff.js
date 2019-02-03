"use strict";

const {GroffAdapter} = require("..");
const {existsSync, statSync} = require("fs");
const {join} = require("path");

describe("GroffAdapter", function(){
	this.timeout(5000);
	let groff = null;
	
	before("Locating groff binary", async () => {
		groff = await GroffAdapter.loadDefault();
		expect(groff).to.be.an.instanceOf(GroffAdapter);
		expect(existsSync(groff.path)).to.be.true;
		if("win32" !== process.platform)
			expect(Boolean(0o111 & statSync(groff.path).mode)).to.be.true;
	});
	
	describe("Initialisation", () => {
		it("throws an error if constructed without a path", () => {
			const error = "[GroffAdapter::constructor] Cannot initialise without executable path";
			expect(() => new GroffAdapter())    .to.throw(TypeError, error);
			expect(() => new GroffAdapter(""))  .to.throw(TypeError, error);
			expect(() => new GroffAdapter(null)).to.throw(TypeError, error);
		});
	});
	
	describe("traceDefs()", () => {
		it("retrieves line numbers of defined objects", async () => {
			const path = join(__dirname, "fixtures", "troff", "defs.1");
			const defs = await (await GroffAdapter.loadDefault()).traceDefs(path);
			expect(defs.get(path)).to.eql({
				chars:      new Map([["foo", 1]]),
				colours:    new Map([["red", 2]]),
				diversions: new Map([["qux", 3]]),
				macros:     new Map([["foo", 5]]),
				registers:  new Map([["foo", 8]]),
				strings:    new Map([["bar", 7]]),
			});
		});
		
		it("omits definitions which are deleted in the same file", async () => {
			const path = join(__dirname, "fixtures", "troff", "defs.2");
			const defs = await (await GroffAdapter.loadDefault()).traceDefs(path);
			expect(defs.get(path)).to.eql({
				chars:      new Map(),
				colours:    new Map(),
				diversions: new Map(),
				macros:     new Map(),
				registers:  new Map([["foo", 8], ["baz", 11]]),
				strings:    new Map([["foo", 2], ["baz", 5]]),
			});
		});
	});
});
