/**
 * Hack for executables needing an entry-point into an ESM graph.
 *
 * Executes the given handler only if the current process appears
 * to be running with ESM support enabled. Otherwise, a new process
 * is forked with Node's `--experimental-modules` flag set.
 *
 * @param {Function} handler
 * @internal
 */
module.exports = handler => {
	"use strict";
	
	// Raise an exception for Node versions older than v8.5.0
	const [major, minor] = process.version.replace(/^\v/, "").split(".").map(Number);
	if(major < 8 || 8 === major && minor < 5){
		console.error("This program requires Node.js v8.5.0 or later.");
		process.exit(1);
	}

	// ESM support enabled
	const opts = (process.env.NODE_OPTIONS || "").split(/\s+/).filter(Boolean);
	if(-1 !== opts.indexOf("--experimental-modules"))
		return handler();
	
	// ESM unsupported; perform a hacky workaround
	const {spawn} = require("child_process");
	const proc = spawn("node", process.argv.slice(1), {
		stdio: ["inherit", "inherit", "pipe"],
		env: Object.assign({}, process.env, {
			NODE_OPTIONS: (process.env.NODE_OPTIONS || "") + " --experimental-modules",
		}),
	});
	proc.stderr.on("data", data => {
		data = String(data).replace(/^.*ExperimentalWarning: The ESM module loader is experimental.*\n/m, "");
		process.stderr.write(data);
	});
};
