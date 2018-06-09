"use strict";

const fs            = require("fs");
const PageReference = require("./page-reference.js");
const ShellCache    = require("./shell-cache.js");
const TroffType     = require("./troff-type.js");


/**
 * Interface for querying and loading system manpages.
 * @class
 */
class PageLoader{

	/**
	 * Initialise a new loader instance.
	 * @constructor
	 */
	constructor(){
		this.shell = new ShellCache();
	}

	
	/**
	 * Load a manpage file, then render it.
	 *
	 * @example <caption>Using `man -w`</caption>
	 *   load("sync", "8");
	 *   load("sync.8");
	 * 
	 * @example <caption>Loading by filepath</caption>
	 *   load("./sync.8");
	 *   load("/usr/share/man/man8/sync.8");
	 * 
	 * @param {String} topic
	 * @param {String} [section=""]
	 * @param {String} [format="tty"]
	 * @public
	 */
	async load(topic, section = "", format = "tty"){
		const src = await (-1 !== topic.indexOf("/") && fs.existsSync(topic))
			? await this.shell.loadFile(topic)
			: await this.locate(topic, section).then(async paths => {
				
				// Gzipped manpages end with a ".gz" suffix
				if(/\.gz$/i.test(paths[0])){
					const data     = await this.shell.loadFile(paths[0], "binary");
					const unzipped = await this.shell.exec("gunzip", [], data, "", "binary");
					return unzipped.stdout;
				}
				return this.shell.loadFile(paths[0], "utf8");
			});
		return src && this.format(src, format);
	}
	
	
	/**
	 * Retrieve the path(s) for a named manpage.
	 *
	 * @see {@link PageReference.resolve}
	 * @example locate("man", "1") == "/usr/share/man/man1/man.1";
	 * @param {String}   topic    - Page's topic, title, or subject
	 * @param {Section} [section] - Section number with possible group-suffix
	 * @param {String}  [manPath] - Optional search path
	 * @param {String}  [arch]    - System architecture (OpenBSD)
	 * @internal
	 */
	async locate(){
		const page   = new PageReference(...arguments);
		const args   = [...await this.getSearchArgs(), ...page.args].filter(Boolean);
		const result = await this.shell.exec("man", args);
		const paths  = result.stdout.trim().split(/\n+/);
		
		// Raise an exception if nothing was found.
		if(!paths.length)
			throw Object.assign(new ReferenceError(), {
				command: `man ${args.join(" ")}`,
				exitCode: result.code,
				detail:   result.stderr,
				message: (arguments.length > 1)
					? `No manual entry for ${page.name} in section ${page.section}`
					: `No manual entry for ${page.name}`,
			});
		
		return paths;
	}
	

	/**
	 * Format a chunk of raw Roff source.
	 * 
	 * @param {String} input
	 * @param {String} [format="tty"]
	 * @return {String}
	 */
	async format(input, format = "tty"){
		const troffType = await this.getTroffType();
		const cmds      = await troffType.guessPipeline(input, format);
		
		// Resolve page-width if formatting a manual-page
		if("tty" === format){
			const pageWidth = this.columns * 9/10;
			input = `.ll ${pageWidth}v\n.nr LL ${pageWidth}v\n${input}`;
		}
		
		// Nested arrays indicate use of (pre/post)-processor(s)
		const {stdout} = await (Array.isArray(cmds[0])
			? this.shell.chain(cmds, input)
			: this.shell.exec(cmds[0], cmds[1], input));
		
		return stdout;
	}
	
	
	/**
	 * Determine which options to pass to man(1) to locate manpages.
	 *
	 * On most systems, this will be `["-aw"]`; however, these flags
	 * are not universally supported. On Solaris, the `-w` flag lacks
	 * any support, while on Illumos, it updates the whatis(1) database
	 * instead of printing the location of manpages.
	 *
	 * @example argsToLocate() => ["-k"]; // Solaris 11.3
	 * @return {Promise} Resolves with an array of option strings.
	 * @internal
	 */
	async getSearchArgs(){
		if(this.searchArgs && this.searchArgs.length)
			return this.searchArgs;
		
		const haveMan = await this.shell.which("man");
		if(!haveMan)
			throw new Error("Missing required executable: man");
		
		// Ensure `-aw` is supported by the host's `man` implementation
		const {code, stdout} = await this.shell.exec("man", ["-aw", "man"]);
		if(!code && stdout){
			const paths = stdout.trim().split(/\n+/);
			if(paths.length && fs.existsSync(paths[0]))
				return this.manOpts = ["-aw"];
		}
		
		// Non-zero exit code indicates lack of `-aw` support
		const result = await this.shell.exec("man", ["-k", "man"]);
		if(result.code)
			throw new Error("`man -k man` returned " + result.code);
		
		// Assumption: If man(1) is available, its manual-page is too.
		const pagePath = result.stdout.match(/\S+\/man\.[0-9](?=\s|$)/);
		if(!pagePath || fs.existsSync(pagePath)){
			const error = new Error("Missing manpage path for man(1)");
			error.details = result;
			throw error;
		}
		
		return this.manOpts = ["-k"];
	}
	
	
	/**
	 * Locate and identify the system's troff(1) executable.
	 * 
	 * @return {Promise}
	 *    Resolves to a {@link TroffType} instance, which is
	 *    stored on the instance's `.troffType' property. 
	 *
	 * @throws {Error} If no troff or troff-like program was found
	 * @internal
	 */
	async getTroffType(){
		return (this.troffType instanceof TroffType)
			? this.troffType
			: await TroffType.resolveDefault();
	}
}

module.exports = PageLoader;
