"use strict";

const fs        = require("fs");
const {shell}   = require("../");
const TroffType = require("./troff-type");
const HTMLTTY   = require("./postproc/html-tty");
let hostTroff   = null;


/**
 * Interface for loading, querying, and displaying manpages.
 * FIXME: Detangle formatting methods
 * @class
 */
class ManPager{
	
	/**
	 * Instantiate a new pager instance.
	 * @param {Object} [attr={}]
	 */
	constructor(attr = {}){
		this.renderer  = new HTMLTTY();
		this.headless  = !!attr.headless;
		this.manArgs   = attr.manArgs   || [];
		this.troffType = attr.troffType || null;
		
		if(!this.headless){
			const parentEl    = attr.parentElement || null;
			const element     = document.createElement("output");
			element.className = "manpage-view";
			Object.assign(element.style, {
				fontSize:   this.pointSize,
				fontFamily: this.fontFamily,
				lineHeight: this.lineHeight,
				display:    "block",
				whiteSpace: "pre",
			});
			this.element      = parentEl.appendChild(element);
			this.elementStyle = window.getComputedStyle(element);
		}
	}
	
	
	/**
	 * Load a manpage file, then render it.
	 *
	 * @example <caption>Using `man -w`</caption>
	 *   formatPage("sync", "8");
	 *   formatPage("sync.8");
	 * 
	 * @example <caption>Loading by filepath</caption>
	 *   formatPage("./sync.8");
	 *   formatPage("/usr/share/man/man8/sync.8");
	 * 
	 * @param {String} topic
	 * @param {String} [section=""]
	 * @param {String} [format="tty"]
	 * @public
	 */
	async formatPage(topic, section = "", format = "tty"){
		const data = (-1 !== topic.indexOf("/") && fs.existsSync(topic))
			? await shell.loadFile(topic)
			: await this.locatePage(topic, section).then(paths => {
				return shell.loadFile(paths[0]);
			});
		data && this.formatSource(data, format);
	}
	
	
	/**
	 * Format a chunk of raw Roff source.
	 * 
	 * @param {String} input
	 * @param {String} [format="tty"]
	 * @public
	 */
	async formatSource(input, format = "tty"){
		const troffType = await this.resolveTroff();
		const [cmd, args] = await troffType.guessPipeline(input, format);
		const ll = this.columns * 9/10;
		input = `.ll ${ll}v\n.nr LL ${ll}v\n${input}`;
		input = (await shell.exec(cmd, args, input)).stdout;
		const data = this.renderer.process(input);
		!this.headless
			? this.element.innerHTML = this.renderer.output
			: process.stdout.write(this.renderer.output);
	}
	
	
	/**
	 * Retrieve the path(s) for a named manpage.
	 *
	 * @example locatePage("man(1)") == "/usr/share/man/man1/man.1";
	 * @param {...String} args - Topic and optional section number
	 * @see {@link ManPager.resolve}
	 * @internal
	 */
	async locatePage(...args){
		const {stdout} = await shell.exec("man", [
			...await this.argsToLocate(),
			...ManPager.resolve(...args).reverse(),
		].filter(Boolean));
		return stdout.trim().split(/\n+/);
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
	async argsToLocate(){
		if(this.manOpts && this.manOpts.length)
			return this.manOpts;
		
		const haveMan = await shell.which("man");
		if(!haveMan)
			throw new Error("Missing required executable: man");
		
		// Verify `man -aw` support
		const {code, stdout} = await shell.exec("man", ["-aw", "man"]);
		if(!code && stdout){
			const paths = stdout.trim().split(/\n+/);
			if(paths.length && fs.existsSync(paths[0]))
				return this.manOpts = ["-aw"];
		}
		
		// Non-zero exit code indicates lack of `-aw` support
		const die = (msg, details) => {
			const error = new Error(msg);
			Object.assign(error, details || {});
			throw error;
		};
		const result = await shell.exec("man", ["-k", "man"]);
		if(result.code)
			die("`man -k man` returned " + result.code, result);
		
		const pagePath = result.stdout.match(/\S+\/man\.[0-9](?=\s|$)/);
		if(!pagePath || fs.existsSync(pagePath))
			die("Missing manpage path for man(1)", result);
		
		return this.manOpts = ["-k"];
	}
	
	
	/**
	 * Ascertain the location and capabilities of the pager's troff(1).
	 * 
	 * @return {Promise} Resolves with a {@link TroffType} instance.
	 * @internal
	 */
	async resolveTroff(){
		if(this.troffType && "object" === typeof this.troffType)
			return this.troffType;
		
		if(null === hostTroff)
			hostTroff = await TroffType.resolveDefault();
		
		return this.troffType = hostTroff;
	}
	

	/**
	 * Width of the container element, measured in columns.
	 * @property {Number}
	 * @default 80
	 * @readonly
	 */
	get columns(){
		if(this.element)
			return Math.ceil(this.element.offsetWidth / this.pointSize);
		return ("object" === typeof process)
			? process.stdout.columns
			: 80;
	}
	
	
	/**
	 * Height of the container element, measured in lines.
	 * @property {Number}
	 * @default 25
	 * @readonly
	 */
	get rows(){
		if(this.element)
			return Math.ceil(this.element.offsetHeight / this.pointSize);
		return ("object" === typeof process)
			? process.stdout.rows
			: 25;
	}
	
	
	/**
	 * Name of the typeface(s) used for displaying rendered output.
	 * @property {String} fontFamily
	 * @default "Menlig, monospace"
	 */
	get fontFamily(){
		return this.element
			? this.elementStyle.fontFamily
			: "Menlig, monospace";
	}
	set fontFamily(to){
		if(!this.element) return;
		if(to = String(to || ""))
			this.elementStyle.fontFamily = to;
	}
	
	
	/**
	 * Font-size of the rendered output, measured in pixels.
	 * @property {Number} pointSize
	 * @default 16
	 */
	get pointSize(){
		return this.element
			? parseFloat(this.elementStyle.fontSize)
			: 16;
	}
	set pointSize(to){
		if(!this.elment) return;
		if(to = Math.max(0, parseFloat(to) || 0))
			this.element.style.fontSize = `${to}px`;
	}
	
	
	/**
	 * Font-size of the rendered output, measured in EM units.
	 * @property {Number}
	 */
	get pointSizeInEms(){
		return this.pointSize / 16;
	}
	set pointSizeInEms(to){
		to = parseFloat(to) || 0;
		this.pointSize = to * 16;
	}
	
	
	/**
	 * Leading expressed as a multiplier of point-size.
	 * @property {Number} lineHeight
	 * @default 1.5
	 */
	get lineHeight(){
		return this.element
			? parseFloat(this.elementStyle.lineHeight)
			: 1.5;
	}
	set lineHeight(to){
		if(!this.element) return;
		if((to = parseFloat(to) || 0) >= 0)
			this.element.style.lineHeight = to;
	}
	
	
	/**
	 * Resolve a reference to a named manual-page.
	 *
	 * @public
	 * @example <caption>Basic usage</caption>
	 *   resolve("getopt(3)")  => ["getopt", "3"]
	 *   resolve("getopt", 3)  => ["getopt", "3"]
	 *   resolve("getopt")     => ["getopt", ""]
	 *
	 * @param {...String} args
	 *   One or two strings, denoting topic (and possible section),
	 *   expressed in one of the following formats:
	 *
	 *       topic            - "foo"
	 *       topic(section)   - "foo(5)"
	 *       topic section    - "foo", "5"
	 *       section topic    - "5", "foo"
	 *
	 *   The last format is only accepted if the section begins with
	 *   a digit, falls below 5 characters in length, and precedes a
	 *   topic name which does *not* begin with an ASCII digit.
	 *
	 * @example <caption>Handling of non-numeric section names.</caption>
	 *   resolve("3pm", "if")  => ["if", "3pm"]
	 *   resolve("if", "ntcl") => ["if", "ntcl"]
	 *   resolve("ntcl", "if") => ["ntcl", "if"]
	 * 
	 * @return {String[]}
	 *   An array containing name and section, respectively.
	 *   Empty strings indicate unspecified or invalid input.
	 */
	static resolve(...args){
		switch(args.length){
			case 0:
				return ["", ""];
			case 1:
				return /^\s*([^()<>\s]+)\s*\(([^\)\s]+)\)\s*$/.test(args[0])
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
}


module.exports = ManPager;
