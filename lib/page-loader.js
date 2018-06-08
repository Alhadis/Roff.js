"use strict";

const fs            = require("fs");
const {shell}       = require("..");
const TroffType     = require("./troff-type.js");
const PageReference = require("./page-reference.js");


/**
 * Interface for communicating with troff(1) and man(1).
 * @class
 */
class PageLoader{
	
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
			? await shell.loadFile(topic)
			: await this.locate(topic, section).then(async paths => {
				
				// Gzipped manpages end with a ".gz" suffix
				if(/\.gz$/i.test(paths[0])){
					const data = await shell.loadFile(paths[0], "binary");
					const unzipped = await shell.exec("gunzip", [], data, "", "binary");
					return unzipped.stdout;
				}
				return shell.loadFile(paths[0], "utf8");
			});
		return src && this.format(src);
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
		const page   = PageReference.get(...arguments);
		const args   = [...await this.getSearchArgs(), ...page.args].filter(Boolean);
		const result = await shell.exec("man", args);
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
	 * @public
	 */
	async format(input, format = "tty"){
		const troffType = await this.getTroff();
		const cmds = await troffType.guessPipeline(input, format);
		
		// Resolve page-width if formatting a manual-page
		if("tty" === format){
			const pageWidth = this.columns * 9/10;
			input = `.ll ${pageWidth}v\n.nr LL ${pageWidth}v\n${input}`;
		}
		
		// Nested arrays indicate use of (pre/post)-processor(s)
		const {stdout} = await (Array.isArray(cmds[0])
			? shell.chain(cmds, input)
			: shell.exec(cmds[0], cmds[1], input));
		
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
		
		const haveMan = await shell.which("man");
		if(!haveMan)
			throw new Error("Missing required executable: man");
		
		// Ensure `-aw` is supported by the host's `man` implementation
		const {code, stdout} = await shell.exec("man", ["-aw", "man"]);
		if(!code && stdout){
			const paths = stdout.trim().split(/\n+/);
			if(paths.length && fs.existsSync(paths[0]))
				return this.manOpts = ["-aw"];
		}
		
		// Non-zero exit code indicates lack of `-aw` support
		const result = await shell.exec("man", ["-k", "man"]);
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
	 *    Resolves to a {@link TroffType} instance. The result
	 *    is assigned to the loader's {@link #troff} property.
	 *
	 *    Future calls to this method will reuse the result to
	 *    avoid redundant lookups. To force another search,
	 *    overwrite {@link #troff} with a falsey value.
	 *
	 * @throws {Error} If no troff or troff-like program was found
	 * @internal
	 */
	async getTroff(){
		return (this.troff instanceof TroffType)
			? this.troff
			: await TroffType.resolveDefault();
	}
}


/**
 * Integers representing the different states of
 * a PageLoader's lifecycle.
 *
 * @enum {Number}
 * @readonly
 */
PageLoader.LoadState = {
	
	/** Nothing has been loaded or requested yet. */
	UNLOADED: 0,
	
	/**
	 * The PageLoader is locating or identifying the
	 * the host system's default troff(1) executable.
	 */
	RESOLVING_TROFF: 1,

	/**
	 * A {@link TroffType} has been identified for the
	 * host system, and the PageLoader is now ready to
	 * load manpages.
	 */
	READY: 2,

	/**
	 * A load-request has been initialised, but the physical
	 * location of the manpage file has not yet been determined.
	 */
	SEARCHING: 3,

	/** A file is currently being read or processed. */
	LOADING: 4,

	/**
	 * The last request finished successfully, and the
	 * rendered manpage is now visible/readable to the user.
	 */
	DONE: 5,
	
	/**
	 * An exception was raised whilst performing some
	 * asynchronous system task.
	 */
	ERROR: 6,
};

module.exports = PageLoader;
