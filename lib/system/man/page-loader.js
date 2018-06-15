"use strict";

const fs               = require("fs");
const ShellCache       = require("../shell-cache.js");
const TroffType        = require("../troff-type.js");
const ManPageReference = require("./page-reference.js");


/**
 * Interface for querying, loading, and formatting system manpages.
 *
 * An instance of this class manages all interaction between the Node
 * process and the system's troff(1) and man(1) binaries. Because shell
 * commands are cached internally, authors are encouraged to use only
 * one (shared) ManPageLoader instance to reduce extraneous system calls.
 *
 * @property {ShellCache} shell - Cached system commands and loaded files
 * @class
 */
class ManPageLoader{

	/**
	 * Initialise a new loader instance.
	 * @constructor
	 */
	constructor(){
		this.shell = new ShellCache();
	}

	
	/**
	 * Load a manpage file, without altering or interpreting its
	 * markup. Man-pages may be specified either as a name/section
	 * pair, or with an explicit pathname pointing to the file.
	 *
	 * Filenames which end in `.gz` are assumed to be gzipped,
	 * and piped through gunzip(1) before being returned. (The
	 * host system is assumed by default to have a gunzip(1)
	 * implementation available).
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
	 * @param {String} [manPath=""]
	 * @param {String} [arch=""]
	 * @return {Promise}
	 *    Resolves with unformatted Roff source. Its contents must
	 *    be transformed further using {@link ManPageLoader.format}
	 *    if one desires another output format.
	 *
	 * @public
	 */
	async load(topic, section = "", manPath = "", arch = ""){
		return (-1 !== topic.indexOf("/") && fs.existsSync(topic))
			? await this.shell.loadFile(topic)
			: await this.locate(topic, section, manPath, arch).then(async paths => {
				
				// Gzipped manpages end with a ".gz" suffix
				if(/\.gz$/i.test(paths[0])){
					const data     = await this.shell.loadFile(paths[0], "binary");
					const unzipped = await this.shell.exec("gunzip", [], data, "", "binary");
					return unzipped.stdout;
				}
				return this.shell.loadFile(paths[0], "utf8");
			});
	}
	
	
	/**
	 * Retrieve the path(s) for the named manpage.
	 *
	 * @example <caption>TheAverageExample™</caption>
	 *   locate("man", "1") == "/usr/share/man/man1/man.1";
	 *   locate("grep", 1) == "/usr/share/man/man1/grep.1";
	 *
	 * @param {String}   topic    - Page's topic, title, or subject
	 * @param {Section} [section] - Section number with possible group-suffix
	 * @param {String}  [manPath] - Optional search path
	 * @param {String}  [arch]    - System architecture (OpenBSD)
	 * @public
	 */
	async locate(){
		const page   = new ManPageReference(...arguments);
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
	 * Format a chunk of raw Roff markup.
	 *
	 * @param  {String} input
	 * @param  {String} [format="postscript"] - Desired destination format
	 * @param  {Array}  [extraArgs]  - Additional arguments passed to troff(1)
	 * @param  {String} [outputFile] - Save the formatted results to disk
	 * @return {String}
	 */
	async format(input, format = "postscript", extraArgs = [], outputFile = ""){
		const troffType = this.troffType || await TroffType.resolveDefault();
		const cmds      = await troffType.guessPipeline(input, format, extraArgs);
		
		// Resolve page-width if formatting a manual-page
		if("tty" === format){
			const pageWidth = this.columns * 9/10;
			input = `.ll ${pageWidth}v\n.nr LL ${pageWidth}v\n${input}`;
		}
		
		// Nested arrays indicate use of (pre/post)-processor(s)
		const {stdout} = await (Array.isArray(cmds[0])
			? this.shell.chain(cmds, input)
			: this.shell.exec(cmds[0], cmds[1], input));
		

		// Write to a file if an output path was desginated
		if(outputFile){
			// FIXME: Some TroffTypes use Ditroff for PS, others don't! (e.g., Solaris)
			// FIXME: How to deal with other formats not supported by older TroffTypes?
			// FIXME: How to handle output encoding for PDF for Groff? fs.writeFile uses
			//        `utf8` by default, whereas PDF files are (mostly/usually) binary.
			await fs.writeFile(outputFile, stdout);
		}

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
				return this.searchArgs = ["-aw"];
		}
		
		// Non-zero exit code indicates lack of `-aw` support
		const result = await this.shell.exec("man", ["-k", "man"]);
		if(result.code){
			const error = new Error("`man -k man` returned " + result.code);
			error.details = result;
			throw error;
		}
		
		// Assumption: If man(1) is available, its manual-page is too.
		const pagePath = result.stdout.match(/\S+\/man\.[0-9](?=\s|$)/);
		if(!pagePath || fs.existsSync(pagePath)){
			const error = new Error("Missing manpage path for man(1)");
			error.details = result;
			throw error;
		}
		
		return this.searchArgs = ["-k"];
	}
}

module.exports = ManPageLoader;
