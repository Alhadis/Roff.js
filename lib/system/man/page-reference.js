"use strict";

/**
 * Reference to a manpage.
 * @class
 */
class ManPageReference{
	
	/**
	 * Define a reference to a manpage.
	 *
	 * @param {Object} [attr={}]
	 * @constructor
	 */
	constructor(attr = {}){
		if(arguments.length > 2) attr = {
			name:    arguments[0],
			section: arguments[1],
			manPage: arguments[2],
			arch:    arguments[3],
		};
		const name    = attr.name    || "";
		const section = attr.section || "";
		const arch    = attr.arch    || "";
		const manPath = attr.manPath || "";
		
		Object.defineProperties(this, {
			name:    {value: String(name)},
			section: {value: String(section)},
			manPath: {value: String(manPath)},
			arch:    {value: String(arch)},
			
			// Inferred/auxiliary properties
			sectionNumber: {value: +section[0]},
			sectionGroup:  {value: section.substr(1)},
		});
	}


	/**
	 * Iterate through the URL's separate subcomponents in the
	 * order they appear in Reference-accepting constructors}.
	 */
	[Symbol.iterator](){
		const parts = [this.name, this.section, this.manPath, this.arch];
		let index = 0;
		return {
			next(){
				const value = parts[index++];
				return value ? {value} : {done: true};
			}
		};
	}
	
	
	/**
	 * List of CLI arguments in an order supported by man(1).
	 *
	 * The `arch` property is elided because the `-S` switch
	 * is specific to bsdman(1), and therefore unportable.
	 * 
	 * @example <caption>Loading nroff(1b), man.conf(5)</caption>
	 *    nroff1b.args => ["1b", "nroff"];
	 *    manConf.args => ["5", "man.conf"];
	 *
	 * @example <caption>Loading grep(1) with `manPath`</caption>
	 *    grep1.args => ["-M", "/man/path", "1", "grep"];
	 *
	 * @property {String[]}
	 * @readonly
	 */
	get args(){
		const args = [this.name];
		this.section && args.unshift(this.section);
		this.manPath && args.unshift("-M", this.manPath);
		return args;
	}
	
	
	/**
	 * Format the manpage reference using conventional notation.
	 * @example grep.toString() === "grep(1)";
	 * @return {String}
	 */
	toString(){
		return this.section
			? `${this.name}(${this.section})`
			: `${this.name}`;
	}
	
	
	/**
	 * Generate a plain-object representaion for JSON encoding.
	 * @return {Object}
	 */
	toJSON(){
		const result = {};
		if(this.name)    result.name    = this.name;
		if(this.section) result.section = this.section;
		if(this.arch)    result.arch    = this.arch;
		if(this.manPath) result.manPath = this.manPath;
		return result;
	}
	
	
	/**
	 * Format the reference as a RFC 3986-conformant URL.
	 *
	 * @see {ManPageReference.parseURL}
	 * @example grep.toURL() === "man://grep/1";
	 * @param {Boolean} [useCGI=false] - Format URL for man.cgi(8)
	 * @return {String}
	 */
	toURL(useCGI = false){
		const path = [
			useCGI && this.manPath,
			useCGI && this.arch,
			this.name,
			this.section,
		].filter(Boolean).join("/");
		return this.fragment
			? `man://${path}#${this.fragment}`
			: `man://${path}`;
	}


	/**
	 * Resolve a reference to a named manual-page.
	 *
	 * @public
	 * @example <caption>Basic usage</caption>
	 *    resolve("getopt(3)")  => ["getopt", "3"]
	 *    resolve("getopt", 3)  => ["getopt", "3"]
	 *    resolve("getopt")     => ["getopt", ""]
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
	 *    resolve("3pm", "if")  => ["if", "3pm"]
	 *    resolve("if", "ntcl") => ["if", "ntcl"]
	 *    resolve("ntcl", "if") => ["ntcl", "if"]
	 *
	 * @return {String[]}
	 *    An array containing name and section, respectively.
	 *    Empty strings indicate unspecified or invalid input.
	 */
	static resolve(...args){
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
	 * Split a `man://` URL into readable components.
	 *
	 * @public
	 * @example <caption>Basic usage</caption>
	 *    ManPageReference.fromURL("man://roff/7#history") => {
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
	 *    ManPageReference.fromURL("man://sparc64/lom.4", true) => {
	 *       name: "lom",
	 *       section: "4",
	 *       arch: "sparc64",
	 *    };
	 *
	 * @param {Boolean} [useCGI=false]
	 *    Interpret input as a man.cgi(8) style URL.
	 *
	 * @return {ManPageReference}
	 *    Returns either a new reference object, or `null`
	 *    if the input string didn't match a "man://" URL.
	 */
	static fromURL(input, useCGI = false){
		if(useCGI){
			const match = input.match(/^man:\/\/(.*?)\.(\d[-\w]*)(#.+)?$/);
			if(!match) return null;
			const path = match[1].split(/\//);
			return new ManPageReference({
				name: path.pop() || "",
				arch: path.pop() || "",
				path: path.join("/"),
				section: match[2],
				fragment: (match[3] || "").replace(/^#/, ""),
			});
		}
		const match = input.match(/^man:\/\/(?:editor:([^:@]+)@)?([^/#]+)\/?(\d+[-\w]*)?\/?(?:#(.*))?$/i);
		if(null !== match)
			return new ManPageReference({
				editorID: match[1],
				name:     match[2],
				section:  match[3],
				fragment: (match[4] || "").replace(/^#/, ""),
			});
		else return null;
	}
	
	
	/**
	 * Convert a string into a lowercase, URL-friendly identifier.
	 *
	 * @example slugify("Here's a title.") == "heres-a-title"
	 * @param {String} input
	 * @return {String}
	 */
	static slugify(input){
		return (input || "").toString()
			.toLowerCase()
			.replace(/(\w)'(re)(?=\s|$)/g, "$1-are")
			.replace(/(\w)'s(?=\s|$)/g, "$1s")
			.replace(/[^\w$]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "");
	}
}


module.exports = ManPageReference;
