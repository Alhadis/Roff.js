/**
 * Execute an external command.
 *
 * Resolves to an object with `stdin`, `stdout`, and `code` properties.
 * Rejects with an error if the subprocess emitted an "error" event. 
 *
 * @example exec("sed", ["-e", "s/in/out/"], "input");
 * @param {String}       command     - Name of the command to execute.
 * @param {String[]}     argList     - Arguments/switches passed to command.
 * @param {String}      [input=null] - Data to pipe to standard input, if any.
 * @param {ExecOptions} [options={}] - Additional options. See {@link ExecOptions}.
 * @return {Object}
 */
export async function exec(command, argList = [], input = null, options = {}){
	const defaultEncoding = "utf8";
	if("string" === typeof options)
		options = {encoding: options};
	let {encoding = defaultEncoding, outputPath = ""} = options;
	const proc = (await import("child_process")).spawn(command, argList, {
		env: {...process.env, ...options.env},
		cwd: options.cwd,
		windowsHide: true,
		stdio: outputPath
			? ["pipe", (await import("fs")).openSync(outputPath, "w"), "pipe"]
			:  "pipe",
	});
	let stdout = "";
	let stderr = "";
	if("string" === typeof encoding)
		encoding = new Array(3).fill(encoding);
	if(null !== input){
		proc.stdin.write(input, encoding[0] || defaultEncoding);
		proc.stdin.end();
	}
	if(!outputPath){
		proc.stdout.setEncoding(encoding[1] || defaultEncoding);
		proc.stdout.on("data", data => stdout += data);
	}
	proc.stderr.setEncoding(encoding[2] || defaultEncoding);
	proc.stderr.on("data", data => stderr += data);
	return new Promise((resolve, reject) => {
		proc.on("close", code => resolve({code, stdout, stderr}));
		proc.on("error", error => reject(error));
	});
}

/**
 * @typedef {Object|String} ExecOptions
 * @description
 *    Extra options used by {@link exec}. Strings are considered shorthand for `{encoding: "…"}`.
 *
 * @param {String} [cwd]
 *    Current working directory of executed command.
 *
 * @param {String[]|String} [encoding="utf8"]
 *    Character encodings of stdin, stdout and stderr, respectively. Strings are
 *    treated as shorthand for setting the encodings of all three streams at once.
 *
 * @param {Object} [env={}]
 *    Environment variables to include on top of the contents of {@link process.env}.
 *    Matching keys are overwritten; the existing environment is unaffected.
 *
 * @property {String} [outputPath=""]
 *    Path to direct stdout to. Empty values mean standard output will be
 *    captured and returned as the resolved object's `stdout` property.
 */


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
