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
	if("string" === typeof encoding)
		encoding = [,,,].fill(encoding);
	if(null !== inputData){
		proc.stdin.write(inputData, encoding[0]);
		proc.stdin.end();
	}
	if(!outputPath){
		proc.stdout.setEncoding(encoding[1]);
		proc.stdout.on("data", data => stdout += data);
	}
	proc.stderr.setEncoding(encoding[2]);
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
 * Deserialise a URL which uses a non-standard man(1) schema.
 *
 * @public
 * @example <caption>Basic usage</caption>
 *    parseManURL("man://apropos/1#options") => {
 *       name: "apropos",
 *       section: "1",
 *       fragment: "options",
 *    };
 *
 * @param {String} input
 *    A well-formed URI containing a page's name and possible section.
 *
 *    No standard schema exists for man(1) URLs, but several invented ones
 *    exist. This function attempts to support as many as possible using a
 *    "DWIM" approach; some example formats are:
 *   
 *        man:name.section          - Bwana        (macOS)
 *        man:name(section)         - GNOME, KDE   (Linux)
 *        x-man-doc://3/printf(3)   - ManOpen      (macOS)
 *        x-man-page://section/name - Terminal.app (macOS 10.3+)
 *        x-man://name.section
 *
 *    For slash-delimited formats, {@link resolveManRef} is used to disambiguate
 *    the order of section and title fields. This stipulates that non-numeric or
 *    unconventional sections are impossible to specify without bracketed form.
 *
 * @example <caption>Handling of non-numeric section names</caption>
 *    parseManURL("man://misc/7z")  => {name: "misc", section: "7z"};
 *    parseManURL("man://7z(misc)") => {name: "7z", section: "misc"};
 *
 * @return {?ParsedManURL}
 *    Returns an object with string-typed properties if input
 *    matches a recognised URL format; otherwise, returns `null`.
 */
export function parseManURL(input){
	const decode = array => array.map(decodeURIComponent);
	const protocol = input.match(/^\s*(?:x-)?man(?:-?(?:page|doc))?:(?:\/\/)?/i);
	if(!protocol) return null;
	
	let match, fragment, username, password, name, section, searchPath;
	input = input.slice(protocol[0].length)
		.replace(/#.*$/, str => (fragment = str.slice(1), ""))
		.replace(/\/+$/, "")
		.replace(/^[^:@]+(?::[^@]*)?@(?=\S)/, match => {
			match    = decode(match.slice(0, -1).split(":"));
			username = match.shift();
			password = match.join(":");
			return "";
		});
	
	// Simple/obvious notations
	if(match = (
		// man://name(section)
		input.match(/^([^/()]+)\(([^\s()]*)\)$/)
		
		// man://name.section
		|| input.match(/^([^/()]+)\.((?:[1-9ln]|%3[1-9]|%6[CEce])[^/\s().]*)$/)
	)) [, name, section] = decode(match);
	
	// URL copied by ManOpen: x-man-doc://1/printf(1)
	else if(match = input.match(/^([1-9ln][^\s()]*)\/([^/()]+)\(\1\)$/))
		[, section, name] = decode(match);
	
	// Slash-delimited URL
	else{
		input = decode(input.split("/").filter(Boolean));
		switch(input.length){
			// Invalid/empty URL
			case 0:
				return null;
			
			// man://name
			case 1:
				[name] = input;
				break;
			
			// man://section/name, man://name/section
			case 2:
				[name, section] = resolveManRef(...input);
				break;
			
			// Ambiguous arguments; try to figure out if name comes first or last
			default: {
				const isSection = /^[1-9][-\w]{0,4}$|^[ln]$/;
				
				// man://name/section/.../extra/path/segments
				if(isSection.test(input[1]) && !isSection.test(input[input.length - 2]))
					[name, section, ...input] = input;
				
				// man://extra/path/segments/.../section/name - Order used by man.cgi(8)
				else{
					name    = input.pop();
					section = input.pop();
				}
				
				searchPath = input.join("/");
			}
		}
	}
	
	/**
	 * @typedef {Object} ParsedManURL
	 * @property {String} [name=""]
	 *    Page's title or topic.
	 *
	 * @property {String} [section=""]
	 *    Section number with possible group suffix.
	 *
	 * @property {String} [fragment=""]
	 *    Fragment identifier used for deep-linking. A leading "#" is omitted.
	 *
	 * @property {String} [searchPath=""]
	 *    Extraneous path segments assumed to be a search-path (in the manner
	 *    of man.cgi(8) URLs). Only populated when input contains too many
	 *    slash-separated segments, such as "man://foo/bar/1/grep".
	 *
	 * @property {String} [username=""]
	 *    Authorised username, specified using "man://user:pass@grep.1".
	 *    Intended to be used as a hack for storing some domain-specific
	 *    property, such as an instanced window ID.
	 *
	 * @property {String} [password=""]
	 *    Password string accompanying a username field (see above).
	 *    Not intended to be used for genuine authorisation purposes.
	 */
	return {
		name:       name       || "",
		section:    section    || "",
		fragment:   fragment   || "",
		searchPath: searchPath || "",
		username:   username   || "",
		password:   password   || "",
	};
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
