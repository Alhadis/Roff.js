import {splitOptions, splitPipeline} from "../../utils/general.mjs";
import {readFile, resolvePath}       from "../../utils/env-shims.mjs";
import {exec, execChain, which}      from "../../utils/shell.mjs";
import * as tmacs                    from "./macro-packages.mjs";


/**
 * Driver for interfacing with GNU Troff (groff).
 *
 * This class exists to provide an idiot-proof front-end to groff(1) for
 * JS-based graphical editors like Atom and VSCode. It is *not* designed
 * to replace groff(1) or any other command-line executable.
 *
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
			await this.loadExtras();
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
	 * Load every known preprocessor and anciliary program.
	 * @internal
	 */
	async loadExtras(){
		const prefix = process.env.GROFF_COMMAND_PREFIX || "";
		const hasOpt = async opt => opt && !(await exec(this.path, ["-V", "-" + opt], "/dev/null")).code;
		const locate = async (name, option = "") => {
			let path;
			for(name of [name, "g" + name, (prefix && "g" !== prefix) ? prefix + name : ""])
				if(name && (path = await which(name))){
					option = await hasOpt(option) ? option : null;
					return {name, path, option};
				}
			return null;
		};
		this.extras = {
			grog:      await locate("grog"),
			chem:      await locate("chem",    "j"),
			eqn:       await locate("eqn",     "e"),
			grap:      await locate("grap",    "G"),
			grn:       await locate("grn",     "g"),
			ideal:     await locate("ideal",   "J"),
			pic:       await locate("pic",     "p"),
			preconv:   await locate("preconv", "k"),
			refer:     await locate("refer",   "R"),
			soelim:    await locate("soelim",  "s"),
			tbl:       await locate("tbl",     "t"),
			dformat:   await locate("dformat"),
			glilypond: await locate("glilypond"),
			gperl:     await locate("gperl"),
			gpinyin:   await locate("gpinyin"),
		};
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
	 * @param {Boolean}  [options.auto]           - Determine formatting options automatically
	 * @param {Boolean}  [options.asciiApprox]    - Generate an ASCII approximation of output
	 * @param {Boolean}  [options.chemicals]      - Preprocess with chem(1), if available
	 * @param {Boolean}  [options.compatMode]     - Enable compatibility mode
	 * @param {String}   [options.defaultFont]    - Default font family
	 * @param {Number}   [options.defaultStroke]  - Default stroke width
	 * @param {Boolean}  [options.equations]      - Preprocess with eqn(1)
	 * @param {Boolean}  [options.expandLinks]    - Preprocess with soelim(1)
	 * @param {Boolean}  [options.fixEncoding]    - Preprocess with preconv(1)
	 * @param {String}   [options.fontDescPath]   - Path of device DESC files
	 * @param {Boolean}  [options.graphs]         - Preprocess with grap(1), if available
	 * @param {Boolean}  [options.gremlins]       - Preprocess with grn(1)
	 * @param {Boolean}  [options.ideal]          - Preprocess with gideal(1), if available
	 * @param {String[]} [options.includePaths]   - Additional directories to search for referenced files
	 * @param {String}   [options.inputFile]      - Format the given file, prepending any given input
	 * @param {Boolean}  [options.landscape]      - Print landscape pages for devices which support it
	 * @param {String}   [options.macroFilePath]  - Search path for macro files
	 * @param {String[]} [options.macros]         - List of macro packages to include
	 * @param {Boolean}  [options.noColours]      - Disable coloured output
	 * @param {Boolean}  [options.noErrors]       - Suppress error messages
	 * @param {Boolean}  [options.noNewlines]     - Forbid newlines within eqn(1) delimiters
	 * @param {Number}   [options.numCopies]      - Print multiple copies of each page
	 * @param {String}   [options.outputFile]     - Redirect output to file, instead of buffering it
	 * @param {String}   [options.pageLength]     - Override page-length
	 * @param {Number}   [options.pageStartIndex] - Begin numbering pages from the given index
	 * @param {String[]} [options.pageRanges]     - Print only the pages within the given ranges
	 * @param {String}   [options.pageWidth]      - Override page-width/line-length
	 * @param {String}   [options.paperSize]      - Physical dimensions of output medium
	 * @param {Boolean}  [options.pictures]       - Preprocess with pic(1)
	 * @param {String[]} [options.preprocessors]  - Arbitrary commands to preprocess input with
	 * @param {Boolean}  [options.raw]            - Return ditroff source instead of postprocessed output
	 * @param {Boolean}  [options.refer]          - Preprocess with refer(1)
	 * @param {Object}   [options.registers]      - Predefined registers
	 * @param {Object}   [options.strings]        - Predefined strings
	 * @param {Boolean}  [options.tables]         - Preprocess with tbl(1)
	 * @param {Boolean}  [options.unsafe]         - Enable potentially-unsafe Roff requests
	 * @return {String}
	 */
	async format(input, device, options = {}){
		await this.loadPromise;
		input = String(input || "");
		options = {...options};
		
		// Add input directory to search paths
		(options.includePaths = Array.from(options.includePaths || [])).push(options.macroFilePath);
		if(options.inputFile){
			const {resolve, dirname} = await import("path");
			options.includePaths.push(resolve(dirname(options.inputFile)));
		}
		
		// Determine options automagically; those provided explicitly take precedence
		if(options.auto){
			if(input && options.inputFile){
				input += await readFile(options.inputFile);
				delete options.inputFile;
			}
			options = this.mergeOptions(await this.guessOptions(input, device, options), options);
		}
		
		// Enable pic(1) if using preprocessors which generate pic output
		if(options.chemicals || options.graphs || options.ideal)
			options.pictures = true;
		
		// Collect options which can be bundled
		let args = "";
		options.asciiApprox && (args += "a");
		options.chemicals   && (args += "j");
		options.compatMode  && (args += "C");
		options.equations   && (args += "e");
		options.expandLinks && (args += "s");
		options.fixEncoding && (args += "k");
		options.graphs      && (args += "G");
		options.gremlins    && (args += "g");
		options.ideal       && (args += "J");
		options.noColours   && (args += "c");
		options.noErrors    && (args += "E");
		options.noNewlines  && (args += "N");
		options.pictures    && (args += "p");
		options.refer       && (args += "R");
		options.tables      && (args += "t");
		options.unsafe      && (args += "U");
		args = [args && "-" + args];
		
		// Collect search paths
		for(const path of options.includePaths)
			path && args.push("-I", path);
		
		// Collect transparent options which take arguments
		const features = this.getDeviceFeatures(device);
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
		
		// Concatenate file contents with input string, if both were specified
		let {inputFile} = options;
		if(inputFile && input){
			input += await readFile(inputFile);
			inputFile = "";
		}
		
		// Apply preprocessors
		const preprocessors = Array.from(options.preprocessors || []).filter(Boolean);
		if(preprocessors.length){
			if(inputFile){
				input = await readFile(inputFile);
				inputFile = "";
			}
			const result = await execChain(preprocessors, input, "binary");
			if(result.code)
				throw new Error(result.stderr || result.stdout);
			input = result.stdout;
		}
		
		// Nullify input parameter if we're reading directly from a file
		if(inputFile){
			input = null;
			args.push(inputFile);
		}
		
		// Format with groff(1)
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
	 * Determine the most appropriate options to format Roff source.
	 *
	 * @example groff.guessOptions(".TH TBL") => {macros: ["an"], tables: true};
	 * @param  {String}  input                - Unprocessed Roff source
	 * @param  {String}  [device="ps"]        - Postprocessor being used
	 * @param  {Object}  [options={}]         - Additional options passed to grog(1)
	 * @param  {Boolean} [options.compatMode] - Enable compatibility mode
	 * @param  {String}  [options.inputFile]  - Read from file, prepending any input
	 * @param  {Boolean} [options.ligatures]  - Force ligatures to be used
	 * @return {Object}
	 * @internal
	 */
	async guessOptions(input, device = "ps", options = {}){
		await this.loadPromise;
		options = {...options};
		
		// Concatenate input sources if both are present
		if(input && options.inputFile){
			input += await readFile(options.inputFile);
			delete options.inputFile;
		}
		
		// Use grog(1) if available
		if(this.extras.grog){
			const args = ["-T" + device];
			options.compatMode && args.push("-C");
			options.ligatures  && args.push("--ligatures");
			if(options.inputFile){
				args.push(options.inputFile);
				input = null;
			}
			options = splitPipeline((await exec(this.extras.grog.path, args, input)).stdout);
			return this.normaliseOptions(options);
		}
		
		// Attempt to guess options ourselves if grog(1) is unavailable
		if(options.inputFile)
			input = await readFile(options.inputFile);
		options = {};
		const pipe = new Set();
		if(/^[.']\\" ([egGjJpRst]+)/.test(input))
			for(const flag of RegExp.$1.split(""))
				switch(flag){
					case "e": options.equations   = true; break;
					case "G": options.graphs      = true; break;
					case "g": options.gremlins    = true; break;
					case "j": options.chemicals   = true; break;
					case "J": options.ideal       = true; break;
					case "p": options.pictures    = true; break;
					case "R": options.refer       = true; break;
					case "s": options.expandLinks = true; break;
					case "t": options.tables      = true; break;
				}
		
		input = input
			.replace(/^[.'][ \t]*(?:\.[ \t*])?\\["#].*$/gm, "")
			.replace(/\\\n/g, "")
			.replace(/^(?!)[.'].*\n/gm, "");
		
		const macroDefs = new Set(); // User-defined macros
		const macroUses = {};        // Uses per macro
		const tmacRanks = {};        // Total macro-uses per tmac
		
		for(const line of input.split(/\n+/)){
			if(/^[.'](?:\s*do)?\s*(?:m?so|PS\s*<|SO_START)/.test(line))
				options.expandLinks = true;
			
			// Record macro definition
			else if(/^[.']\s*de1?\s+([^\s\\]+)/.test(line))
				macroDefs.add(RegExp.$1);
			
			else if(/^[.']\s*([^\s\\]+)/.test(line)){
				const {$1} = RegExp;
				if(macroDefs.has($1)) continue;
				switch($1){
					case "PS":
					case "PF":
					case "PE":       options.pictures  = true; break;
					case "cstart":   options.chemicals = true; break;
					case "EE":
					case "EQ":       options.equations = true; break;
					case "G1":       options.graphs    = true; break;
					case "GS":       options.gremlins  = true; break;
					case "IS":       options.ideal     = true; break;
					case "R1":       options.refer     = true; break;
					case "TE":
					case "TS":       options.tables    = true; break;
					case "Perl":     pipe.add("gperl");        break;
					case "pinyin":   pipe.add("gpinyin");      break;
					case "lilypond": pipe.add("glilypond");    break;
					default:
						for(const key in tmacs)
							if(-1 !== tmacs[key].indexOf($1)){
								macroUses[$1]  = (macroUses[$1]  || 0) + 1;
								tmacRanks[key] = (tmacRanks[key] || 0) + 1;
							}
				}
			}
			if(/\bbegin\s+(\w+)\s*$/.test(line))
				switch(RegExp.$1){
					case "chem":    options.chemicals = true; break;
					case "dformat": pipe.add("dformat");      break;
				}
		}
		const [tmac] = Object.keys(tmacRanks).sort((a, b) => {
			if(tmacRanks[a] > tmacRanks[b]) return -1;
			if(tmacRanks[a] < tmacRanks[b]) return 1;
			return 0;
		});
		if(tmac) options.macros = [tmac];
		options.preprocessors = [...pipe];
		return this.normaliseOptions(options);
	}
	
	
	/**
	 * Merge a list of option objects.
	 *
	 * @param {...Object} args
	 * @return {Object}
	 * @internal
	 */
	mergeOptions(...args){
		const result = Object.create(null);
		for(const arg of args)
			for(const key in arg){
				const value = arg[key];
				if(Array.isArray(value))
					(result[key] = Array.isArray(result[key])
						? result[key]
						: []).push(...value);
				else if(value && "object" === typeof value)
					result[key] = {...result[key], ...value};
				else result[key] = value;
			}
		return result;
	}
	
	
	/**
	 * Remove unsupported options and convert argv arrays into key/value pairs.
	 *
	 * Options shared between groff(1) and preprocessors (such as `-C`) will apply
	 * to the *entire* pipeline, which may be undesirable when used inconsistently.
	 * Unrecognised options are ignored; to pass arbitrary arguments, use the `.args`
	 * property of the returned object. See {@link #format} for details.
	 *
	 * @example groff.normaliseOptions([["groff", "-man"]]) == {macros: ["an"]};
	 * @param {Object|Array<String[]>} input
	 * @return {Object}
	 * @internal
	 */
	normaliseOptions(input){
		let postOpts;
		const opts = Object.create(null);
		if(!input || "object" !== typeof input)
			return opts;
		
		// Input is a list of command/argv arrays
		if(Array.isArray(input)){
			opts.includePaths  = [];
			opts.macros        = [];
			opts.preprocessors = [];
			opts.registers     = Object.create(null);
			opts.strings       = Object.create(null);
			
			input = input.map(x => Array.isArray(x) ? x : [x]).filter(x => x && x.length);
			if(!input.some(x => "groff" === x[0]))
				throw new TypeError("Pipeline must include groff(1)");
			top: for(let [cmd, ...argv] of input)
				switch(cmd){
					case "chem":  opts.chemicals = true; break;
					case "ideal": opts.ideal     = true; break;
					case "refer": opts.refer     = true; break;
					case "groff": {
						const define = (target, def) => /^([^=\s]+)=(.*)/.test(def)
							? target[RegExp.$1] = RegExp.$2
							: target[def[0]] = def.substr(1);
						const optsWithArgs = "DFIKLMPTWdfmnorw";
						argv = splitOptions(argv, ["CEGNRSUVXZabceghijklpstvz", optsWithArgs]);
						const {length} = argv;
						for(let i = 0; i < length; ++i){
							let arg = argv[i];
							if(!arg) continue;
							if("-" !== arg[0])
								opts.inputFile = arg;
							else switch(arg = arg.substr(1)){
								case "a": opts.asciiApprox = true; break;
								case "c": opts.noColours   = true; break;
								case "C": opts.compatMode  = true; break;
								case "e": opts.equations   = true; break;
								case "E": opts.noErrors    = true; break;
								case "g": opts.gremlins    = true; break;
								case "G": opts.graphs      = true; break;
								case "j": opts.chemicals   = true; break;
								case "J": opts.ideal       = true; break;
								case "k": opts.fixEncoding = true; break;
								case "N": opts.noNewlines  = true; break;
								case "p": opts.pictures    = true; break;
								case "R": opts.refer       = true; break;
								case "s": opts.expandLinks = true; break;
								case "t": opts.tables      = true; break;
								case "U": opts.unsafe      = true; break;
								case "Z": opts.raw         = true; break;
								
								// Options which take arguments
								case "I": opts.includePaths .push(argv[++i]); break;
								case "m": opts.macros       .push(argv[++i]); break;
								case "f": opts.defaultFont      = argv[++i];  break;
								case "F": opts.fontDescPath     = argv[++i];  break;
								case "M": opts.macroFilePath    = argv[++i];  break;
								case "n": opts.pageStartIndex   = argv[++i];  break;
								case "o": opts.pageRanges       = argv[++i];  break;
								case "d": define(opts.strings,    argv[++i]); break;
								case "r": define(opts.registers,  argv[++i]); break;
								
								// Postprocessor options
								case "P":
									(postOpts = postOpts || []).push(argv[++i]);
									break;
								
								// Ignore anything else
								default: ~optsWithArgs.indexOf(arg) && ++i; break;
							}
						}
						break top;
					}
					
					case "eqn": {
						opts.equations = true;
						const optsWithArgs = "MTdfmps";
						argv = splitOptions(cmd[1], ["CNRrv", optsWithArgs]);
						const {length} = argv;
						for(let i = 0; i < length; ++i){
							let arg = argv[i];
							if(!arg) continue;
							if("-" !== arg[0])
								opts.inputFile = arg;
							else switch(arg = arg.substr(1)){
								case "C": opts.compatMode      = true;       break;
								case "N": opts.noNewlines      = true;       break;
								case "M": opts.includePaths.push(argv[++i]); break;
								default: ~optsWithArgs.indexOf(arg) && ++i;  break;
							}
						}
						break;
					}

					case "grap": {
						opts.graphs = true;
						argv = splitOptions(argv, ["CDRchlruv", "Md"]);
						const {length} = argv;
						for(let i = 0; i < length; ++i){
							let arg = argv[i];
							if(!arg) continue;
							if("-" !== arg[0])
								opts.inputFile = arg;
							else switch(arg = arg.substr(1)){
								case "C": opts.compatMode = true; break;
								case "M": opts.includePaths.push(argv[++i]); break;
								case "d": ++i; break; // Ignore
							}
						}
						break;
					}
					
					case "grn": {
						opts.gremlins = true;
						argv = splitOptions(argv, ["Cv", "TMF"]);
						const {length} = argv;
						for(let i = 0; i < length; ++i){
							let arg = argv[i];
							if(!arg) continue;
							if("-" !== arg[0])
								opts.inputFile = arg;
							else switch(arg = arg.substr(1)){
								case "C": opts.compatMode      = true;       break;
								case "F": opts.fontDescPath    = argv[++i];  break;
								case "M": opts.includePaths.push(argv[++i]); break;
							}
						}
						break;
					}
					
					case "pic": {
						opts.pictures = true;
						argv = splitOptions(argv, ["CDSUcntvz", "T"]);
						const {length} = argv;
						for(let i = 0; i < length; ++i){
							let arg = argv[i];
							if(!arg) continue;
							if("-" !== arg[0])
								opts.inputFile = arg;
							else switch(arg = arg.substr(1)){
								case "C": opts.compatMode = true; break;
								case "U": opts.unsafe     = true; break;
							}
						}
						break;
					}
					
					case "soelim": {
						opts.expandLinks = true;
						argv = splitOptions(argv, ["Crtv", "I"]);
						const {length} = argv;
						for(let i = 0; i < length; ++i){
							let arg = argv[i];
							if(!arg) continue;
							if("-" !== arg[0])
								opts.inputFile = arg;
							else switch(arg = arg.substr(1)){
								case "C": opts.compatMode = true; break;
								case "I": opts.includePaths.push(argv[++i]); break;
							}
						}
						break;
					}
					
					case "tbl": {
						opts.tables = true;
						argv = splitOptions(argv, ["Cv"]);
						if(argv.includes("-C"))
							opts.compatMode = true;
						const file = argv.find(x => "-" !== x[0]);
						if(file)
							opts.inputFile = file;
						break;
					}
					
					// Treat everything else as an arbitrary preprocessor
					default:
						opts.preprocessors.push([cmd, ...argv]);
						break;
				}
		}
		
		// Input is an ordinary object
		else Object.assign(opts, input);
		
		// Handle postprocessor options
		if(postOpts){
			postOpts = splitOptions(postOpts, ["l", "cwp"]);
			const {length} = postOpts;
			for(let i = 0; i < length; ++i)
				switch(postOpts[i]){
					case "-l": opts.landscape     = true;          break;
					case "-c": opts.numCopies     = postOpts[++i]; break;
					case "-w": opts.defaultStroke = postOpts[++i]; break;
					case "-p": opts.paperSize     = postOpts[++i]; break;
				}
		}
		
		// Prune empty options and purge unsupported preprocessors
		this.resolvePreprocessors(opts);
		for(const key in opts)
			if(Array.isArray(opts[key]) && !opts[key].length)
				delete opts[key];
		if(0 === Object.keys(opts.registers || {}).length) delete opts.registers;
		if(0 === Object.keys(opts.strings   || {}).length) delete opts.strings;
		
		return opts;
	}
	
	
	/**
	 * Remove unsupported preprocessor options.
	 * @param {Object} opts
	 * @return {Object}
	 * @internal
	 */
	resolvePreprocessors(opts){
		opts = {...opts};
		let pipe = Array.from(opts.preprocessors || []);
		if(!this.extras.chem)      { delete opts.chemicals;   pipe = pipe.filter(x => "chem"    !== x[0]); }
		if(!this.extras.eqn)       { delete opts.equations;   pipe = pipe.filter(x => "eqn"     !== x[0]); }
		if(!this.extras.soelim)    { delete opts.expandLinks; pipe = pipe.filter(x => "soelim"  !== x[0]); }
		if(!this.extras.preconv)   { delete opts.fixEncoding; pipe = pipe.filter(x => "preconv" !== x[0]); }
		if(!this.extras.grap)      { delete opts.graphs;      pipe = pipe.filter(x => "grap"    !== x[0]); }
		if(!this.extras.grn)       { delete opts.gremlins;    pipe = pipe.filter(x => "grn"     !== x[0]); }
		if(!this.extras.refer)     { delete opts.refer;       pipe = pipe.filter(x => "refer"   !== x[0]); }
		if(!this.extras.tbl)       { delete opts.tables;      pipe = pipe.filter(x => "tbl"     !== x[0]); }
		if(!this.extras.ideal)     { delete opts.ideal;       pipe = pipe.filter(x => !/^g?ideal$/i.test(x[0])); }
		if(!this.extras.dformat)   { pipe = pipe.filter(x => "dformat"   !== x[0]); }
		if(!this.extras.glilypond) { pipe = pipe.filter(x => "glilypond" !== x[0]); }
		if(!this.extras.gperl)     { pipe = pipe.filter(x => "gperl"     !== x[0]); }
		if(!this.extras.gpinyin)   { pipe = pipe.filter(x => "gpinyin"   !== x[0]); }
		if(!this.extras.pic){
			delete opts.chemicals;
			delete opts.pictures;
			delete opts.graphs;
			delete opts.ideal;
			pipe = pipe.filter(x => !/^(?:g?pic|chem|dformat|grap|g?ideal)$/i.test(x[0]));
		}
		
		// Resolve missing preprocessor flags (for older Groff versions).
		if(opts.chemicals && !this.extras.chem.option){
			delete opts.chemicals;
			opts.pictures = true;
			pipe.push([this.extras.chem.path]);
		}
		if(opts.graphs && !this.extras.grap.option){
			delete opts.graphs;
			opts.pictures = true;
			pipe.push([this.extras.grap.path, opts.compatMode && "-C"]);
		}
		if(opts.ideal && !this.extras.ideal.option){
			delete opts.ideal;
			opts.pictures = true;
			pipe.push([this.extras.ideal.path]);
		}
		opts.preprocessors = pipe
			.filter(x => x && x[0])
			.map(x => x.filter(Boolean));
		return opts;
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
