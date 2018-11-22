/**
 * Execute an external command.
 *
 * Resolves to an object with `stdin`, `stdout`, and `code` properties.
 * Rejects with an error if the subprocess emitted an "error" event. 
 *
 * @example exec("sed", ["-e", "s/in/out/"], "input");
 * @param {String}   command          - Executed command
 * @param {String[]} argList          - List of arguments/switches
 * @param {String}  [inputData=null]  - Data piped to stdin
 * @param {String}  [outputPath=""]   - File to write stdout to
 * @param {String}  [encoding="utf8"] - Character encoding
 * @return {Promise}
 */
export async function exec(command, argList = [], inputData = null, outputPath = "", encoding = "utf8"){
	const proc = (await import("child_process")).spawn(command, argList, {
		windowsHide: true,
		stdio: outputPath
			? ["pipe", (await import("fs")).openSync(outputPath, "w"), "pipe"]
			:  "pipe",
	});
	let stdout = "";
	let stderr = "";
	if(null !== inputData){
		proc.stdin.write(inputData, encoding);
		proc.stdin.end();
	}
	if(!outputPath){
		proc.stdout.setEncoding(encoding);
		proc.stdout.on("data", data => stdout += data);
	}
	proc.stderr.setEncoding(encoding);
	proc.stderr.on("data", data => stderr += data);
	return new Promise((resolve, reject) => {
		proc.on("close", code => resolve({code, stdout, stderr}));
		proc.on("error", error => reject(error));
	});
}


/**
 * Execute a pipeline of chained commands.
 *
 * Resolves to an object with `stdin`, `stdout`, and `code` properties
 * derived from the last command that finished executing.
 *
 * @uses {@link exec}
 * @example execChain([["ps", "ax"], ["grep", "ssh"]], stdin);
 * @param {Array[]} commands         - List of commands/argv pairs
 * @param {String} [inputData=null]  - Data piped to stdin
 * @param {String} [outputPath=""]   - File to write stdout to
 * @param {String} [encoding="utf8"] - Character encoding
 * @return {Promise}
 */
export async function execChain(commands, inputData = null, outputPath = ""){
	commands = commands.slice();
	let result = {};
	while(commands.length){
		let command = commands.shift();
		if("string" === typeof command)
			command = [command];
		const [cmd, ...argv] = command;
		const output = commands.length ? "" : outputPath;
		result = await exec(cmd, argv, inputData, output);
		inputData = result.stdout;
	}
	return result;
}


/**
 * Execute a string as an unescaped shell command.
 *
 * @example <caption>Shell-like invocation with tagged templates</caption>
 *    import {execString as $} from "./utils.js";
 *    const checksums = await $ `git log --oneline | cut -d' ' -f1`;
 *    const forty     = await $ `printf %s "${checksums}" | wc -l`;
 *
 * @param {String} input
 *    Source of the command(s) to execute.
 *
 * @return {Promise}
 *    Resolves with the command's standard output.
 */
export async function execString(input, ...values){
	const {exec} = await import("child_process");
	input = Array.isArray(input) && Array.isArray(input.raw)
		? input.raw.map((string, index) => string + (values[index] || "")).join("")
		: [input, ...values].join(" ");
	return new Promise((resolve, reject) => {
		exec(input, (error, stdout, stderr) => error
			? reject(Object.assign(error, {stdout, stderr}))
			: resolve(stdout));
	});
}


/**
 * Split a `man://` URL into readable components.
 *
 * @public
 * @example <caption>Basic usage</caption>
 *    parseManURL("man://roff/7#history") => {
 *       name: "roff",
 *       section: "7",
 *       fragment: "history",
 *    };
 *
 * @param {String} input 
 *    A well-formed URL using the faux "man://" protocol.
 *    Syntax should match one of the following formats:
 *    
 *        man://[editor:id@]name/[section][#fragment]
 *        man://[manpath/][arch/]name[.sec][#fragment]
 *    
 *    The first format is intended for use by atom(1); the
 *    second is used by man.cgi(8). Which format gets used
 *    depends on the value of the `useCGI` parameter.
 *
 * @example <caption>Using man.cgi(8) syntax</caption>
 *    parseManURL("man://sparc64/lom.4", true) => {
 *       name: "lom",
 *       section: "4",
 *       arch: "sparc64",
 *    };
 *
 * @param {Boolean} [useCGI=false]
 *    Interpret input as a man.cgi(8) style URL.
 *
 * @return {Object|null}
 *    Returns either a new reference object, or `null`
 *    if the input string didn't match a "man://" URL.
 */
export function parseManURL(input, useCGI = false){
	if(useCGI){
		const match = input.match(/^man:\/\/(.*?)\.(\d[-\w]*)(#.+)?$/);
		if(!match) return null;
		const path = match[1].split("/");
		return {
			name: path.pop() || "",
			arch: path.pop() || "",
			path: path.join("/"),
			section: match[2],
			fragment: (match[3] || "").replace(/^#/, ""),
		};
	}
	const match = input.match(/^man:\/\/(?:editor:([^:@]+)@)?([^/#]+)\/?(\d+[-\w]*)?\/?(?:#(.*))?$/i);
	if(null !== match)
		return {
			editorID: match[1],
			name:     match[2],
			section:  match[3],
			fragment: (match[4] || "").replace(/^#/, ""),
		};
	else return null;
}


/**
 * Resolve a reference to a named manual-page.
 *
 * @public
 * @example <caption>Basic usage</caption>
 *    resolveManRef("getopt(3)")  => ["getopt", "3"]
 *    resolveManRef("getopt", 3)  => ["getopt", "3"]
 *    resolveManRef("getopt")     => ["getopt", ""]
 *
 * @param {...String} args
 *    One or two strings, denoting topic (and possible section),
 *    expressed in one of the following formats:
 *
 *        topic            - "foo"
 *        topic(section)   - "foo(5)"
 *        topic section    - "foo", "5"
 *        section topic    - "5", "foo"
 *
 *    The last format is only accepted if the section begins with
 *    a digit, falls below 5 characters in length, and precedes a
 *    topic name which does *not* begin with an ASCII digit.
 *
 * @example <caption>Handling of non-numeric section names.</caption>
 *    resolveManRef("3pm", "if")  => ["if", "3pm"]
 *    resolveManRef("if", "ntcl") => ["if", "ntcl"]
 *    resolveManRef("ntcl", "if") => ["ntcl", "if"]
 *
 * @return {String[]}
 *    An array containing name and section, respectively.
 *    Empty strings indicate unspecified or invalid input.
 */
export function resolveManRef(...args){
	switch(args.length){
		case 0:
			return ["", ""];
		case 1:
			return /^\s*([^()<>\s]+)\s*\(([^)\s]+)\)\s*$/.test(args[0])
				? [RegExp.$1, RegExp.$2]
				: [args[0], ""];
		default:
			const result = args.slice(0, 2).map(String);
			const numeric = /^\s*[0-9]\S*\s*$/;
			if(result[0].length < 5 && numeric.test(result[0]) && !numeric.test(result[1]))
				result.reverse();
			return result;
	}
}


/**
 * Locate a program file in the user's $PATH.
 *
 * Resolves with an empty string/array if nothing was found.
 *
 * @example which("curl") == "/usr/bin/curl"
 * @example which("nada") == ""
 * @param {String} name
 * @param {Boolean} [all=false]
 * @return {Promise}
 */
export async function which(name, all = false){
	if(!name) return all ? [] : "";
	const {exec} = await import("child_process");
	const cmdStr = "win32" === process.platform
		? `@for %g in (ECHO ${name.replace(/%/g, "%%")}) do`
			+ " @for %e in (%PATHEXT%) do"
			+ " @for %i in (%g%e) do "
			+ ' @if NOT "%~$PATH:i"=="" echo %~$PATH:i'
		: all
			? "IFS=:; for i in $PATH; do"
				+ ` p="$i/"'${name.replace(/'/g, `'"'"'`)}';`
				+ ' if [ -x "$p" ] && [ -f "$p" ]; then printf "%s\\n" "$p"; fi;'
				+ " done"
			: `command -v '${name.replace(/'/g, `'"'"'`)}' 2>/dev/null || true`;
	const result = await new Promise((resolve, reject) =>
		exec(cmdStr, {windowsHide: true}, (error, output) => error
			? reject(error)
			: resolve(output.split(/\r?\n/).filter(Boolean))));
	return all ? result : result[0] || "";
}
