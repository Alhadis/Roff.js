"use strict";

const fs        = require("fs");
const {shell}   = require("../..");
const TroffType = require("../troff-type.js");
const HTMLTTY   = require("./html-tty.js");
let hostTroff   = null;


/**
 * Interface for loading, querying, and displaying manpages.
 *
 * @todo Simplify this mess, move utility methods elsewhere.
 * @class
 */
class ManPager{
	
	/**
	 * Instantiate a new pager instance.
	 * @param {Object} [attr={}]
	 */
	constructor(attr = {}){
		this.headings  = new Map();
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
			this.boldElements = element.getElementsByTagName("b");
			this.errorHandler = attr.errorHandler || null;
			
			// Navigation handler for `man://` links
			this.element.addEventListener("mouseup", event => {
				const link = event.target.closest("a[href^='man://']");
				if(link){
					const parts = ManPager.parseURL(link.href);
					this.formatPage(parts.name, parts.section)
						.then(() => this.goToAnchor(parts.fragment || this.element))
						.catch(e => this.displayError(e));
					event.preventDefault();
				}
			});
		}
	}
	
	
	/**
	 * Notify the user of an error.
	 *
	 * @param {String} message
	 * @internal
	 */
	displayError(message){
		if(this.headless){
			if(process.stderr.isTTY)
				message = `\x1B[31;1mERROR: \x1B[0m\x1B[31m${message}\x1B[0m`;
			process.stderr.write(message);
		}
		else if("function" === typeof this.errorHandler)
			this.errorHandler.call(this, message);
	}
	
	
	/**
	 * Update the HTML content of the pager's container.
	 *
	 * @param {String} input
	 * @internal
	 */
	displayPage(input){
		if(this.headless)
			process.stdout.write(input);
		
		else if(this.element && this.element.innerHTML !== input){
			this.element.innerHTML = input;
			
			// Remap "headings" list
			this.headings.clear();
			for(const tag of this.boldElements){
				const before = tag.previousSibling;
				
				if(!before || Element.TEXT_NODE !== before.nodeType
				|| !/(?:^|\n)[ \t]*$/.test(before.textContent))
					continue;
				
				const title = ManPager.slugify(tag.textContent.trim());
				this.headings.has(title) || this.headings.set(title, tag);
			}
		}
	}
	
	
	/**
	 * Scroll to a DOM element or named section in the current document.
	 *
	 * @param {HTMLElement|String} dest
	 * @internal
	 */
	goToAnchor(dest){
		if(dest instanceof HTMLElement)
			dest.scrollIntoView();
		else{
			const tag = this.headings.get(ManPager.slugify(dest));
			if(tag && this.element.contains(tag))
				tag.scrollIntoView();
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
		return data && this.formatSource(data, format);
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
		
		this.displayPage(this.renderer.process(stdout));
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
		const {stdout, } = await shell.exec("man", [
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
	 * Generate a URL-friendly slug from a string.
	 *
	 * @example slugify("Here's an ID string.") == "heres-an-id-string"
	 * @param {String} input
	 * @return {String}
	 */
	static slugify(input){
		return (name || "").toString()
			.toLowerCase()
			.replace(/(\w)'(re)(?=\s|$)/g, "$1-are")
			.replace(/(\w)'s(?=\s|$)/g, "$1s")
			.replace(/[^\w$]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "");
	}
	
	
	/**
	 * Split a `man://` URL into readable components.
	 *
	 * @public
	 * @example <caption>Basic usage</caption>
	 *    parseURL("man://roff/7#history") == {
	 *       name: "roff",
	 *       section: "7",
	 *       fragment: "history",
	 *    };
	 *
	 * @param {String} input
	 *   A well-formed URL using the faux "man://" protocol.
	 *   Syntax should match one of the following formats:
	 * 
	 *       man://[editor:id@]name/[section][#fragment]
	 *       man://[manpath/][arch/]name[.sec][#fragment]
	 *
	 *   The first format is intended for use by atom(1); the
	 *   second is used by man.cgi(8). Which format gets used
	 *   depends on the value of the `useCGI` parameter.
	 *
	 * @example <caption>Using man.cgi syntax</caption>
	 *    parseURL("man://sparc64/lom.4", true) == {
	 *       name: "lom",
	 *       section: "4",
	 *       arch: "sparc64",
	 *    };
	 *
	 * @param {Boolean} [useCGI=false]
	 *   Interpret the input as a man.cgi(8) style URL.
	 *
	 * @return {Object|null}
	 */
	static parseURL(input, useCGI = false){
		if(useCGI){
			const match = input.match(/^man:\/\/(.*?)\.(\d[-\w]*)(#.+)?$/);
			if(!match) return null;
			const path = match[1].split(/\//);
			return {
				name: path.pop() || "",
				arch: path.pop() || "",
				path: path.join("/"),
				section: match[2],
				fragment: (match[3] || "").replace(/^#/, ""),
			};
		}
		const match = input.match(/^man:\/\/(?:editor:([^:@]+)@)?([^/#]+)\/?(\d+[-\w]*)?\/?(?:#(.*))?$/i);
		if(null !== match) return {
			editorID: match[1],
			name:     match[2],
			section:  match[3],
			fragment: (match[4] || "").replace(/^#/, ""),
		};
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
