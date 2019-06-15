import {readFile, resolvePath} from "../../utils/env-shims.mjs";
import {exec, which}           from "../../utils/shell.mjs";


/**
 * Driver for interfacing with GNU Troff (groff).
 * @public
 * @class
 */
export default class GroffAdapter {
	
	/**
	 * Initialise a new driver for a known Groff installation.
	 * @param {String} path - Location of groff(1) executable.
	 * @constructor
	 */
	constructor(path){
		if(!path){
			const reason = "[GroffAdapter::constructor] Cannot initialise without executable path";
			throw new TypeError(reason);
		}
		
		this.path = String(path);
		this.loaded = false;
		this.loadPromise = (async () => {
			await this.loadVersion();
			await this.loadDevices();
			await this.loadMacros();
			this.loaded = true;
			return this;
		})();
	}
	
	
	/**
	 * Initialise an adapter for the host's main `groff` executable.
	 * @return {GroffAdapter}
	 * @public
	 */
	static async loadDefault(){
		return this.default = this.default || new this(await which("groff")).loadPromise;
	}
	
	
	/**
	 * Load every known postprocessor.
	 * @internal
	 */
	async loadDevices(){
		this.devices = {};
		const load = async next => {
			const name = next.shift();
			this.devices[name] = await exec(this.path, ["-ZT", name], "Hello, world\n")
				.then(({code, stdout}) => !code && new RegExp(`^x\\s*T\\S*\\s+${name}\\s`).test(stdout))
				.catch(() => false);
			return next.length && load(next);
		};
		await load("dvi html lbp lj4 ps pdf ascii cp1047 latin1 utf8".split(" "));
	}
	
	
	/**
	 * Load all available macros.
	 * @internal
	 */
	async loadMacros(){
		this.macros = {};
		const fs = await import("fs");
		const {join, dirname} = await import("path");
		
		// Resolve macro paths
		this.macros.paths = new Set((await this.locateTmac("an", true)).map(p => dirname(p)));
		
		// Load the contents of troffrc
		this.macros.troffrc = new Map();
		await exec(this.path, ["-zTutf8"], ".pm\n").then(result => {
			if(result.code) throw new Error(result.stderr);
			for(const line of result.stderr.trim().split(/\n+/)){
				const [name, size] = line.split(/\s+/);
				this.macros.troffrc.set(name, +size);
			}
		});
		
		this.macros.tmacs = new Map();
		for(const tmacPath of this.macros.paths){
			const ext = /\.tmac$|^tmac\./i;
			for(const name of fs.readdirSync(tmacPath).filter(name => ext.test(name))){
				const path = join(tmacPath, name);
				const defs = await this.dumpTmac(path);
				this.macros.tmacs.set(name.replace(ext, ""), {path, defs});
			}
		}
	}
	
	
	/**
	 * Extract version string from Groff's `--version` output.
	 * @internal
	 */
	async loadVersion(){
		const {code, stdout} = await exec(this.path, ["--version"]);
		this.version = !code && /\bv?(\d+\.\d+(?:\.\d+)*(?:-\S+)?)\b/.test(stdout)
			? RegExp.lastParen
			: "";
	}
	
	
	/**
	 * Extract the names and sizes of each macro/string defined in a file.
	 * @example dumpTmac("an.tmac") == Map{"Dd" => 31, "TH" => 34 …};
	 * @param {String} path
	 * @return {Map}
	 * @internal
	 */
	async dumpTmac(path){
		const source = `.rm tm\n${await readFile(path)}\n.pm\n`;
		const {code, stderr} = await exec(this.path, ["-zTutf8"], source);
		if(code) throw new Error(stderr);
		const defs = new Map();
		for(const line of stderr.trim().split(/\n+/))
			if(/^(\S+)\s+(\d+)$/.test(line)){
				const name =  RegExp.$1;
				const size = +RegExp.$2;
				if(size === this.macros.troffrc.get(name)) continue;
				defs.set(name, size);
			}
		return defs;
	}
	
	
	/**
	 * Retrieve a list of features supported by the named device.
	 *
	 * @example getDeviceFeatures("pdf") == Set {"fonts", "paperSize"…};
	 * @param {String} device
	 * @return {Set}
	 * @internal
	 */
	getDeviceFeatures(device){
		switch(device){
			case "dvi":
			case "lbp":
			case "lj4":
			case "ps":
			case "pdf":
				return new Set("copypages ditroff fonts landscape papersize strokewidth".split(" "));
			case "ascii":
			case "cp1047":
			case "latin1":
			case "utf8":
				const features = new Set("ditroff monospace overstrikes".split(" "));
				"cp1047" === device || features.add("encoding");
				return features;
			case "html":
			case "xhtml":
				return new Set("ditroff html");
		}
		const reason = `[GroffAdapter::getDeviceFeatures] Unrecognised device: ${device}`;
		throw new ReferenceError(reason);
	}
	
	
	/**
	 * Print the absolute pathname of a macro package.
	 *
	 * @public
	 * @example locateTmac("an") => "/usr/share/groff/1.19.2/tmac/an.tmac"
	 * @param {String} name - Macro package's name, without a leading "m"
	 * @param {Boolean} [all=false] - Include autoloaded paths with the result
	 * @return {String|String[]}
	 */
	async locateTmac(name, all = false){
		const tmac = await resolvePath("adapters/troff");
		const argv = ["-zTutf8", "-mtrace-paths", "-m" + name, "/dev/null"];
		const {code, stderr} = await exec(this.path, argv, null, {cwd: tmac, env: {GROFF_TMAC_PATH: tmac}});
		if(code) throw new Error(stderr);
		
		const paths = stderr.trim().split(/\n+/);
		if(all) return paths;
		const {basename} = await import("path");
		return paths.find(path => [`${name}.tmac`, `tmac.${name}`].includes(basename(path))) || paths[0];
	}
	
	
	/**
	 * Format unprocessed Roff source.
	 *
	 * @public
	 * @param {String}   input                    - Raw/unprocessed Roff markup
	 * @param {String}   device                   - Name of postprocessor/typesetter device
	 * @param {Object}   [options={}]             - Parameters passed to Groff
	 * @param {String[]} [options.args]           - Additional arguments passed through after everything else
	 * @param {Boolean}  [options.asciiApprox]    - Generate an ASCII approximation of output
	 * @param {Boolean}  [options.compatMode]     - Enable compatibility mode
	 * @param {String}   [options.defaultFont]    - Default font family
	 * @param {Number}   [options.defaultStroke]  - Default stroke width
	 * @param {String}   [options.fontDescPath]   - Path of device DESC files
	 * @param {String}   [options.inputFile]      - Format the given file, prepending any given input
	 * @param {Boolean}  [options.landscape]      - Print landscape pages for devices which support it
	 * @param {String}   [options.macroFilePath]  - Search path for macro files
	 * @param {String[]} [options.macros]         - List of macro packages to include
	 * @param {Boolean}  [options.noColours]      - Disable coloured output
	 * @param {Boolean}  [options.noErrors]       - Suppress error messages
	 * @param {Number}   [options.numCopies]      - Print multiple copies of each page
	 * @param {String}   [options.outputFile]     - Redirect output to file, instead of buffering it
	 * @param {String}   [options.pageLength]     - Override page-length
	 * @param {Number}   [options.pageStartIndex] - Begin numbering pages from the given index
	 * @param {String[]} [options.pageRanges]     - Print only the pages within the given ranges
	 * @param {String}   [options.pageWidth]      - Override page-width/line-length
	 * @param {String}   [options.paperSize]      - Physical dimensions of output medium
	 * @param {Boolean}  [options.raw]            - Return ditroff source instead of postprocessed output
	 * @param {Object}   [options.registers]      - Predefined registers
	 * @param {Object}   [options.strings]        - Predefined strings
	 * @return {String}
	 */
	async format(input, device, options = {}){
		const features = this.getDeviceFeatures(device);
		input = String(input || "");
		
		// Collect transparent options which can be bundled
		let args = "";
		options.asciiApprox && (args += "a");
		options.compatMode  && (args += "C");
		options.noColours   && (args += "c");
		options.noErrors    && (args += "E");
		args = [args && "-" + args];
		
		// Collect transparent options which take arguments
		if(features.has("copypages")   && +options.numCopies     >= 1) args.push("-P-c" + ~~options.numCopies);
		if(features.has("strokewidth") && +options.defaultStroke  > 0) args.push("-P-w" + options.defaultStroke);
		if(features.has("papersize")   && options.paperSize)           args.push("-P-p" + options.paperSize);
		if(features.has("fonts")       && options.defaultFont)         args.push("-f"   + options.defaultFont);
		if(features.has("landscape")   && options.landscape)           args.push("-P-l");
		
		if(options.fontDescPath)   args.push("-F" + options.fontDescPath);
		if(options.macroFilePath)  args.push("-M" + options.macroFilePath);
		if(options.pageStartIndex) args.push("-n" + options.pageStartIndex);
		if(options.pageRanges)     args.push("-o" + options.pageRanges.join(","));
		
		// Pre-defined strings and registers
		const {strings, registers} = options;
		for(const key in strings)   args.push(`-d${key}${1 === key.length ? "" : "="}${strings[key]}`);
		for(const key in registers) args.push(`-r${key}${1 === key.length ? "" : "="}${registers[key]}`);
		
		// Override dimensions
		const width  = "number" === typeof options.pageWidth  ? options.pageWidth  + "n" : options.pageWidth;
		const length = "number" === typeof options.pageLength ? options.pageLength + "n" : options.pageLength;
		if(width)  input = `.ll ${width}\n.nr LL ${width}\n${input}`;
		if(length) input = `.pl ${length}\n${input}`;
		
		// Macro packages
		if(options.macros){
			const macros = "string" === typeof options.macros
				? options.macros.trim().split(/\s+/)
				: Array.from(options.macros);
			args.push(...macros.map(arg => "-m" + arg));
		}
		
		options.raw  && args.push("-Z");
		options.args && args.push(...options.args);
		args.push("-T" + device);
		
		// Resolve input source
		let {inputFile} = options;
		if(inputFile && input){
			input += await readFile(inputFile);
			inputFile = "";
		}
		if(inputFile){
			input = null;
			args.push(inputFile);
		}
		
		const outputEncoding = options.raw ? "utf8" : features.has("encoding") ? device : "binary";
		const result = await exec(this.path, args.filter(Boolean), input, {
			encoding: ["utf8", outputEncoding, "utf8"],
			outputPath: options.outputFile,
		});
		if(result.code)
			throw new Error(result.stderr || result.stdout);
		return result.stdout;
	}
	
	
	/**
	 * Extract the names and line-numbers for each symbol defined in a Roff file.
	 *
	 * This method exists for IDE/editor integration, where its output is useful
	 * for features like autocompletion and definition-lookups. Do not expect it
	 * to be exhaustive or foolproof, especially when nested macros are involved.
	 *
	 * @example <caption>Structure of returned object</caption>
	 * traceDefs("foo.1") => Map {
	 *    "/path/to/foo.1" => {
	 *       chars:      Map {foo => 1}, // line #1: .char foo
	 *       colours:    Map {red => 2}, // line #2: .defcolor red
	 *       diversions: Map {qux => 3}, // line #3: .di qux
	 *       macros:     Map {foo => 5}, // line #5: .de foo
	 *       strings:    Map {bar => 7}, // line #7: .ds bar
	 *       registers:  Map {foo => 8}, // line #8: .nr foo
	 *    },
	 * };
	 * @param {String} path
	 * @return {Map}
	 * @public
	 */
	async traceDefs(path){
		path = (await import("path")).resolve(path);
		const tmac = await resolvePath("adapters/troff");
		const hash = (Math.random() * 1e10).toString(36).replace(/\W/g, "");
		const argv = ["-zTutf8", "-mtrace-defs", "-d!" + hash, "--", path];
		const {code, stderr} = await exec(this.path, argv, null, {cwd: tmac, env: {GROFF_TMAC_PATH: tmac}});
		if(code) throw new Error(stderr);
		
		const defs = new Map();
		for(const line of stderr.trim().split(/\n+/)){
			const match = line.match(/^(define|remove):(\w+):(\d+):([^:]+):(.+)$/);
			if(match){
				let [, action, type, line, file, name] = match;
				
				// Exclude the file used to "monkey-patch" Roff requests
				if("trace-defs.tmac" === file.substr(tmac.length + 1))
					continue;
				
				let defined, fileDefs = defs.get(file);
				fileDefs || defs.set(file, fileDefs = {
					chars:      new Map(),
					colours:    new Map(),
					diversions: new Map(),
					macros:     new Map(),
					registers:  new Map(),
					strings:    new Map(),
				});
				
				line >>= 0;
				type += "s";
				switch(action){
					// Store line-number of definition or register
					case "define":
						if((defined = fileDefs[type]) && !defined.has(name))
							defined.set(name, line);
						break;
					
					// Delete/unset definition
					case "remove":
						// Macros, strings and diversions share the same symbol table
						if("objects" === type){
							if(fileDefs.macros.get(name)     < line) fileDefs.macros.delete(name);
							if(fileDefs.strings.get(name)    < line) fileDefs.strings.delete(name);
							if(fileDefs.diversions.get(name) < line) fileDefs.diversions.delete(name);
						}
						
						// `.rchar' can unset multiple colours at once
						else if("chars" === type){
							for(const char of name.trim().split(/\s+/))
								if(fileDefs.chars.get(char) < line)
									fileDefs.chars.delete(char);
						}
						
						// Remove a definition of any other type
						else if((defined = fileDefs[type]) && defined.get(name) < line)
							defined.delete(name);
				}
			}
		}
		return defs;
	}
}
