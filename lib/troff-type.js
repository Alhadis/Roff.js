"use strict";

const {join, dirname} = require("path");
const {shell}         = require("../");


/**
 * Description of a troff(1) implementation's capabilities.
 * @class
 */
class TroffType{
	
	/**
	 * Construct a hash of implementation data.
	 * 
	 * @param {Object} [attr={}]
	 * @hideconstructor
	 */
	constructor(attr = {}){
		this.name = attr.name || TroffType.UNKNOWN;
		this.path = attr.path || "";
		if(attr.version)
			this.version = attr.version;
		
		switch(this.name){
			case TroffType.GROFF:
				this.fullName   = "GNU Troff";
				this.hasDitroff = true;
				this.hasGrog    = true;
				this.html       = "groff -ZThtml";
				this.markdown   = null;
				this.pdf        = "groff -ZTpdf";
				this.postscript = "groff -ZTps";
				this.tty        = "groff -ZTutf8";
				break;
			
			case TroffType.GROFF_LIKE:
				this.fullName   = "GNU-compatible Troff";
				this.hasDitroff = true;
				this.hasGrog    = false;
				this.html       = "troff -Thtml";
				this.markdown   = null;
				this.pdf        = "troff -Tpdf";
				this.postscript = "troff -Tps";
				this.tty        = "nroff -Tutf8";
				break;
			
			case TroffType.HEIRLOOM:
				this.fullName   = "Heirloom Doctools";
				this.hasDitroff = "troff-only";
				this.hasGrog    = false;
				this.html       = "troff -Thtml";
				this.markdown   = null;
				this.pdf        = null;
				this.postscript = "troff -Tps";
				this.tty        = "nroff -T37";
				break;
			
			case TroffType.MANDOC:
				this.fullName   = "mandoc";
				this.hasDitroff = false;
				this.hasGrog    = false;
				this.html       = "mandoc -Thtml -a";
				this.markdown   = "mandoc -Tmarkdown -a";
				this.pdf        = "mandoc -Tpdf -a";
				this.postscript = "mandoc -Tps -a";
				this.tty        = "mandoc -Tlocale -a";
				break;
			
			case TroffType.AIX:
				this.fullName   = "IBM AIX Troff";
				this.hasDitroff = true;
				this.hasGrog    = false;
				this.html       = null;
				this.markdown   = null;
				this.pdf        = null;
				this.postscript = "troff -Tpsc";
				this.tty        = "nroff -T37";
				break;
			
			case TroffType.SOLARIS10:
				this.fullName   = "Solaris 10 Troff";
				this.hasDitroff = false;
				this.hasGrog    = false;
				this.html       = null;
				this.markdown   = null;
				this.pdf        = null;
				this.postscript = "troff";
				this.tty        = "nroff";
				break;
			
			case TroffType.SOLARIS11:
				this.fullName   = "Solaris 11 Troff";
				this.hasDitroff = "troff-only";
				this.hasGrog    = false;
				this.html       = null;
				this.markdown   = null;
				this.pdf        = null;
				this.postscript = "troff -Tpost";
				this.tty        = "nroff -T37";
				break;
			
			// TODO: Test Plan9
			case TroffType.DWB:
			case TroffType.FRONT:
			case TroffType.PLAN9:
				this.env        = { DWBHOME: dirname(dirname(this.path)) };
				this.fullName   = {
					[TroffType.DWB]:   "Documenter's Workbench",
					[TroffType.FRONT]: "9front Troff",
					[TroffType.PLAN9]: "Plan 9 Troff",
				}[this.name];
				this.hasDitroff = "troff-only";
				this.hasGrog    = false;
				this.html       = null;
				this.markdown   = null;
				this.pdf        = null;
				this.postscript = "troff -Tpost";
				this.tty        = "nroff -T37";
				break;
		}
	}
	
	
	/**
	 * Determine which arguments to use for processing a Roff document.
	 *
	 * @example guessPipeline(source) => [["tbl"], ["groff", ["-Tutf8", "-Z"]]];
	 * @param {String} source - Unprocessed Roff source
	 * @param {String} [format="tty"] - Destination format
	 * @return {Array} A list of command/argv pairs
	 * @internal
	 */
	async guessPipeline(source, format = "tty"){
		
		// Format not supported by implementation.
		if(!this[format]){
			const message = `Output "${format}" not supported by ${this.fullName}`;
			throw Object.assign(new ReferenceError(message), {troffType: this});
		}
		
		// Use grog(1) if available
		if(this.hasGrog && await shell.which("grog")){
			const {stdout} = (await shell.exec("grog", ["-ZTutf8"], source));
			return [stdout.trim().split(/\s+/g)];
		}
		
		// Guess the pipeline ourselves
		// * IDEA: Consider porting Groff's `subs.pl' to JavaScript
		// * TODO: Clean up and shorten this garbage
		else{
			const result = [this[format].split(" ")];
			
			let preprocessors = new Set();
			let macroPackage = "";
			
			if(/^'\\" ([treps]+)/.test(source))
				for(const flag of RegExp.lastParen.split(""))
					switch(flag){
						case "e": preprocessors.add("eqn");    break;
						case "r": preprocessors.add("refer");  break;
						case "p": preprocessors.add("pic");    break;
						case "t": preprocessors.add("tbl");    break;
						case "s": preprocessors.add("soelim"); break;
					}
			
			if(/^\.\\" use tmac: (\S.*)/.test(source)){
				const names = RegExp.lastParen.trim()
					.replace(/,/g, " ")
					.split(/\s+/)
					.filter(Boolean);
				
				for(const name of names){
					if(macroPackage) break;
					switch(name){
						case "mm":   macroPackage = "mm";   break;
						case "me":   macroPackage = "me";   break;
						case "ms":   macroPackage = "ms";   break;
						case "man":  macroPackage = "man";  break;
						case "mdoc": macroPackage = "mdoc"; break;
					}
				}
			}
			
			source = this.filterCommands(source);
			if(/(?:^|\n)[.']P[SF]\s[^\0]+\n[.']PE\s/ .test(source)) preprocessors.add("pic");
			if(/(?:^|\n)[.']TS\s[^\0]+\n[.']TE\s/    .test(source)) preprocessors.add("tbl");
			if(/(?:^|\n)[.']EQ\s[^\0]+\n[.']EN\s/    .test(source)) preprocessors.add("eqn");
			if(/(?:^|\n)[.']cstart\s[^\0]+\n[.']cend/.test(source)) preprocessors.add("chem");
			if(/(?:^|\n)[.'](?:do)?\s*(?:so|mso|PS\s*<|SO_START).*(?:$|\n)/.test(source))
				preprocessors.add("soelim");
			
			// Blind guesses at this point
			if(!macroPackage){
				if(/(?:^|\n)[.']D[dt]\s+(\S+)/.test(source)) macroPackage = "mdoc";
				else if(/(?:^|\n)[.']TH\s+("[^"]+"|\S+)\s+[1-9]/.test(source))
					macroPackage = "man";
				else if(/(?:^|\n)[.']COVER\s/.test(source))  macroPackage = "mm";
				else if(/(?:^|\n)[.']RP\s/.test(source))     macroPackage = "ms";
			}
			
			if("pdf" === format)
				result[0].splice(1, 0, "-mpdf");
			
			switch(macroPackage){
				case "man":  result[0].splice(1, 0, "-man");  break;
				case "mdoc": result[0].splice(1, 0, "-mdoc"); break;
				case "me":   result[0].splice(1, 0, "-me");   break;
				case "mm":   result[0].splice(1, 0, "-mm");   break;
				case "ms":   result[0].splice(1, 0, "-ms");   break;
			}
			for(const proc of preprocessors)
				result.unshift([proc]);
			return result;
		}
	}
	
	
	/**
	 * Strip input of anything which isn't a macro/request line.
	 *
	 * @param {String} input
	 * @return {String}
	 * @internal
	 */
	filterCommands(input){
		
		// Strip comments and empty command-lines
		input = input.replace(/^[.'][ \t]*(?:\\".*)?$\n?/gm, "");
		
		// Collapse escaped newlines
		input = input.replace(/\\$\n?/g, "");
		
		// `.ig' requests
		input = input
			.replace(/^[.'][ \t]*ig\s+(\S+)\s*.*?^[.'][ \t]*\1(?=\s|$)/gm)
			.replace(/^[.'][ \t]*ig\s*(?:\\"[^\n]*)?\n.*?^[.'][ \t]ig(?=\s|$)/gm);
		
		// Text lines
		input = input.replace(/^(?![.'][ \t]*).*$\n?/gm, "");
		
		return input;
	}
	
	
	/**
	 * Determine which implementation of troff(1) the host system uses.
	 *
	 * Results are cached the first time this method is executed.
	 * To force reevaluation, set `ignoreCache` to a truthy value.
	 *
	 * @param {Boolean} [ignoreCache=false]
	 * @return {Promise} Resolves with a {@link TroffType} object.
	 * @internal
	 */
	static async resolveDefault(ignoreCache = false){
		if(!ignoreCache && this.defaultTroff)
			return this.defaultTroff;
		
		// GNU Troff
		let path = await shell.which("groff");
		if(path){
			const version = await this.resolveGroffVersion();
			return new TroffType({path, name: this.GROFF, version});
		}
		
		// "Traditional" Troff
		if(path = await shell.which("troff")){
			
			// Use feature-level detection provided by `which.roff'
			const which  = await shell.loadFile(join(__dirname, "which.roff"));
			const result = await shell.exec("troff", [], which);
			switch(result && result.stderr.trim()){
				case this.GROFF:    return new TroffType({path, name: this.GROFF_LIKE});
				case this.MANDOC:   return new TroffType({path, name: this.MANDOC});
				case this.HEIRLOOM: return new TroffType({path, name: this.HEIRLOOM});
			}
			
			// DWB 3.3 installs troff to `$(PREFIX)/dwb/bin/troff' by default
			if(/([/\\])dwb\1bin\1troff$/i.test(path))
				return new TroffType({path, name: this.DWB});
			
			// Gunnar Ritter's port of Solaris 10's troff
			if(/([/\\])sunroff\1bin\1/i.test(path))
				return new TroffType({path, name: this.SOLARIS10});
			
			// Gunnar Ritter's port of 9front troff
			if(/([/\\])9froff\1bin\1/i.test(path))
				return new TroffType({path, name: this.FRONT});
			
			// Last resort: blindly guess platform-specific troff
			switch(process.platform){
				// IBM AIX/IRIX
				case "aix":
					return new TroffType({path, name: this.AIX});
				
				// Solaris, SmartOS, SunOS
				case "sunos":
					const version = parseFloat(await shell.exec("uname", ["-v"]));
					if(version >= 11 && version < 12) return TroffType({path, version, name: this.SOLARIS11});
					if(version >= 10 && version < 11) return TroffType({path, version, name: this.SOLARIS10});
					break;
			}
			return new TroffType({path, name: this.UNKNOWN});
		}

		// OpenBSD/mandoc
		if(path = await shell.which("mandoc")){
			const version = parseFloat((await shell.exec("uname", ["-r"])).stdout);
			return new TroffType({path, version, name: this.MANDOC});
		}
		
		throw new Error("Missing required executable: troff");
	}
	
	
	/**
	 * Extract the version string from `groff --version` output.
	 * @return {Promise}
	 * @internal
	 */
	static async resolveGroffVersion(){
		const {stdout} = await shell.exec("groff", ["--version"]);
		return /^GNU\s+groff\s+version\s+v?([0-9]+\.[0-9]+\.[0-9]+[^0-9\s]*)/i.test(stdout)
			? RegExp.$1
			: "";
	}
}

// Define flags for known troff(1) implementations.
Object.assign(TroffType, {
	/**
	 * GNU Troff
	 * @constant {String}
	 */
	GROFF: "groff",

	/**
	 * Either GNU Troff masquerading as `troff` without a discoverable
	 * `groff` executable, or an unrecognised modern implementation with
	 * supposedly similar capabilities.
	 * @constant {String}
	 */
	GROFF_LIKE: "groff-like",

	/**
	 * BSD mandoc(1). Not a "true" troff implementation.
	 * @constant {String}
	 */
	MANDOC: "mandoc",

	/**
	 * Heirloom Doctools.
	 * @see https://github.com/n-t-roff/heirloom-doctools
	 * @constant {String}
	 */
	HEIRLOOM: "heirloom",

	/**
	 * Documenter's Workbench 3.3
	 * @see https://github.com/n-t-roff/DWB3.3
	 * @constant {String}
	 */
	DWB: "dwb",
	
	/**
	 * IBM AIX troff
	 * @todo Test with a live install (AIX troff costs moolah)
	 * @see https://ibm.com/support/knowledgecenter/en/ssw_aix_72/com.ibm.aix.cmds5/troff.htm
	 * @constant {String}
	 */
	AIX: "aix",
	
	/**
	 * Solaris 10 ditroff
	 * @see https://github.com/n-t-roff/Solaris10-ditroff
	 * @constant {String}
	 */
	SOLARIS10: "solaris10",
	
	/**
	 * Solaris 11 ditroff
	 * @todo Check/compare this with {@link SOLARIS10}
	 * @constant {String}
	 */
	SOLARIS11: "solaris11",
	
	/**
	 * Plan 9 troff
	 * @see https://github.com/n-t-roff/Plan9_troff
	 * @constant {String}
	 */
	PLAN9: "plan9",
	
	/**
	 * 9front troff
	 * @see https://github.com/n-t-roff/9front_troff
	 * @constant {String}
	 */
	FRONT: "9front",

	/**
	 * An unrecognised or unidentifiable implementation.
	 * @constant {String}
	 */
	UNKNOWN: "unknown",
});

module.exports = TroffType;
