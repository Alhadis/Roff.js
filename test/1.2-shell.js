"use strict";

describe("Shell integration", () => {
	const fs = require("fs");
	
	describe("exec()", function(){
		const {exec} = require("..");
		this.slow(1000);

		it("executes external commands asynchronously", () =>
			expect(exec("true")).to.be.a("promise"));

		it("captures their standard output streams", async () =>
			expect(await exec("printf", ["<%03x>\\n", "255"]))
				.to.have.property("stdout")
				.that.is.a("string")
				.and.that.equals("<0ff>\n"));

		it("captures their standard error streams", async () =>
			expect(await exec("node", ["-e", 'process.stderr.write("Foo")']))
				.to.have.property("stderr")
				.that.is.a("string")
				.and.that.equals("Foo"));

		it("captures the command's exit code", async () =>
			expect(await exec("node", ["-e", "process.exit(3)"]))
				.to.have.property("code")
				.that.is.a("number")
				.and.that.equals(3));

		it("resolves with an object that includes each property", async () =>
			expect(await exec("node", ["-e", `
				process.stdout.write("ABC");
				process.stderr.write("XYZ");
				process.exit(1);
			`])).to.eql({
				stdout: "ABC",
				stderr: "XYZ",
				code: 1,
			}));

		it("always includes each property with the resolved object", async () => {
			expect(await exec("echo"))  .to.eql({stdout: "\n", stderr: "", code: 0});
			expect(await exec("true"))  .to.eql({stdout: "",   stderr: "", code: 0});
			expect(await exec("false")) .to.eql({stdout: "",   stderr: "", code: 1});
		});

		it("can pipe arbitrary data to standard input", async () =>
			expect(await exec("sed", ["-e", "s/in/out/"], "input\n")).to.eql({
				stdout: "output\n",
				stderr: "",
				code: 0,
			}));

		it("can pipe empty input without hanging process", () =>
			Promise.race([
				new Promise((_, reject) => setTimeout(reject, 750)),
				exec("sed", ["-e", "s/A/B/g"], ""),
			]));

		describe("Encoding", () => {
			it("encodes streams as UTF-8 by default", async () => {
				const echo = ["-e", "process.stdin.on('data', bytes => process.stdout.write(bytes))"];
				expect((await exec("node", echo, "𒀻")).stdout).to.equal("𒀻");
			});
			
			it("allows default encodings to be overridden", async () => {
				const echo = ["-e", "process.stdout.write('foo')"];
				const result = await exec("node", echo, null, {encoding: "base64"});
				expect(result).to.eql({stdout: "Zm9v", stderr: "", code: 0});
			});
			
			it("allows per-stream encoding assignment", async () => {
				const echo = ["-e", "process.stdout.write('foo'); process.stderr.write('foo')"];
				expect(await exec("node", echo, null, {encoding: ["utf8", "utf8", "base64"]})).to.eql({
					stdout: "foo",
					stderr: "Zm9v",
					code: 0,
				});
				expect(await exec("node", echo, null, {encoding: ["utf8", "base64", "utf8"]})).to.eql({
					stdout: "Zm9v",
					stderr: "foo",
					code: 0,
				});
			});
			
			it("treats strings as shorthand for `{encoding: …}`", async () => {
				const echo = ["-e", "process.stdout.write('foo'); process.stderr.write('foo')"];
				expect(await exec("node", echo, null, "base64")).to.eql({stdout: "Zm9v", stderr: "Zm9v", code: 0});
			});
			
			it("uses UTF-8 for missing encoding entries", async () => {
				const echo = ["-e", "process.stdout.write('foo'); process.stderr.write('foo')"];
				expect(await exec("node", echo, null, {encoding: ["utf8", "", "base64"]})).to.eql({
					stdout: "foo",
					stderr: "Zm9v",
					code: 0,
				});
				expect(await exec("node", echo, null, {encoding: ["utf8", "base64"]})).to.eql({
					stdout: "Zm9v",
					stderr: "foo",
					code: 0,
				});
			});
		});

		describe("Redirection", function(){
			this.slow(5000);
			const tempFile = require("path").join(__dirname, "fixtures", "temp.log");
			after("Removing temporary file", () => fs.unlinkSync(tempFile));
			
			it("can write standard output to a file", async () => {
				await exec("node", ["-e", "process.stdout.write('Foo\\nBar')"], null, {outputPath: tempFile});
				expect(fs.existsSync(tempFile)).to.be.true;
				expect(fs.readFileSync(tempFile, "utf8")).to.equal("Foo\nBar");
			});
			
			it("replaces a file's existing content", async () => {
				await exec("node", ["-e", "process.stdout.write('Foo\\n')"], null, {outputPath: tempFile});
				expect(fs.existsSync(tempFile)).to.be.true;
				expect(fs.readFileSync(tempFile, "utf8")).to.equal("Foo\n");
				await exec("node", ["-e", "process.stdout.write('Bar')"], null, {outputPath: tempFile});
				expect(fs.readFileSync(tempFile, "utf8")).to.equal("Bar");
			});
			
			it("respects the stream's encoding", async () => {
				const data = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7";
				const emit = ["-e", `process.stdout.write(Buffer.from("${data}", "base64"))`];
				await exec("node", emit, null, {outputPath: tempFile, encoding: "binary"});
				expect(fs.readFileSync(tempFile)).to.eql(Buffer.from(data, "base64"));
			});
		});
	
		describe("Environment", () => {
			const echoEnv = ["-e", "process.stdout.write(JSON.stringify(process.env))"];
			const randomKey = "foo" + Date.now() + Math.random(1e10).toString(16);
			
			it("makes the caller's environment visible to the subprocess", async () =>
				expect(JSON.parse((await exec("node", echoEnv)).stdout)).to.eql(process.env));
			
			it("allows new environment variables to be added", async () => {
				const {stdout} = await exec("node", echoEnv, null, {env: {[randomKey]: "A"}});
				expect(JSON.parse(stdout)).to.have.property(randomKey).which.equals("A");
			});
			
			it("does not replace the existing environment", async () => {
				const {stdout} = await exec("node", echoEnv, null, {env: {[randomKey]: "B"}});
				expect(JSON.parse(stdout)).to.include(process.env);
			});
			
			it("overwrites existing variables of the same name", async () => {
				process.env[randomKey] = "C";
				const {stdout} = await exec("node", echoEnv, null, {env: {[randomKey]: "D"}});
				expect(JSON.parse(stdout)).to.have.property(randomKey).which.equals("D");
				delete process.env[randomKey];
			});
		});

		describe("Working directory", () => {
			const echoCwd = ["-e", "process.stdout.write(process.cwd())"];
			
			let cwd = "";
			afterEach(() => cwd && process.chdir(cwd));
			beforeEach(() => { cwd = process.cwd(); process.chdir(__dirname); });
			
			it("defaults to the parent process's working directory", async () => {
				const {stdout} = await exec("node", echoCwd);
				expect(stdout).to.equal(__dirname);
			});
			
			it("can change the subprocess's working directory", async () => {
				const {join} = require("path");
				cwd = join(__dirname, "fixtures");
				const {stdout} = await exec("node", echoCwd, null, {cwd});
				expect(stdout).to.equal(join(__dirname, "fixtures"));
			});
		});
	});

	describe("execChain()", function(){
		const {execChain} = require("..");
		this.slow(1000);
		
		it("executes a pipeline of external commands", async () =>
			expect(await execChain([
				["printf", "%s\\n", "foo"],
				["sed", "s/foo/bar/"],
				["tr", "a-z", "A-Z"],
			])).to.eql({code: 0, stdout: "BAR\n", stderr: ""}));
		
		it("executes pipelines asynchronously", async () =>
			expect(execChain([["true"]])).to.be.a("promise"));
		
		it("avoids modifying the original command list", async () => {
			const cmds = [["echo", "Foo"], ["grep", "Foo"]];
			const copy = JSON.parse(JSON.stringify(cmds));
			await execChain(cmds);
			expect(cmds).to.eql(copy);
		});
		
		it("returns the exit status of the last command", async () => {
			expect(await execChain([["true"], ["false"]])).to.eql({stdout: "", stderr: "", code: 1});
			expect(await execChain([["false"], ["true"]])).to.eql({stdout: "", stderr: "", code: 0});
		});
		
		it("concatenates each command's stderr stream", async () =>
			expect(await execChain([
				["node", "-e", 'console.log("ABC"); console.warn("123")'],
				["node", "-e", 'console.log("XYZ"); console.warn("456")'],
			])).to.eql({
				code: 0,
				stderr: "123\n456\n",
				stdout: "XYZ\n",
			}));
		
		it("can pipe input to the first command", async () =>
			expect(await execChain([["sed", "s/foo/bar/"]], "<foo>")).to.eql({
				code: 0,
				stderr: "",
				stdout: "<bar>\n",
			}));
		
		it("can write the last command's output to a file", async () => {
			const tmp = require("path").join(__dirname, "fixtures", "temp.log");
			fs.existsSync(tmp) && fs.unlinkSync(tmp);
			expect(await execChain([
				["node", "-e", "console.warn(123); console.log(456)"],
				["sed", "s/456/bar/"],
			], null, {outputPath: tmp})).to.eql({
				code: 0,
				stderr: "123\n",
				stdout: "",
			});
			expect(fs.readFileSync(tmp, "utf8")).to.equal("bar\n");
			fs.unlinkSync(tmp);
		});
	});

	describe("which()", () => {
		const {which} = require("..");
		let firstNode = "";

		it("returns the path of the first matching executable", async () => {
			expect(firstNode = await which("node")).to.not.be.empty;
			const stats = fs.statSync(firstNode);
			expect(stats.isFile()).to.be.true;
			expect(!!(0o111 & stats.mode)).to.be.true;
		});

		it("returns an empty value if nothing was matched", async () =>
			expect(await which("wegfjekrwg")).to.equal(""));

		describe("when the `all` parameter is set", () => {
			it("returns an array of every match", async () => {
				const result = await which("node", true);
				expect(result).to.be.an("array");
				expect(result[0]).to.be.a("string").and.to.equal(firstNode);
			});

			it("returns an empty array if nothing was found", async () => {
				const result = await which("wegfjekrwg", true);
				expect(result).to.be.an("array").with.lengthOf(0);
			});
		});
	});
});
