"use strict";

const {join, dirname} = require("path");
const {shell}         = require("../");


/**
 * Description of a troff(1) implementation's capabilities.
 * @todo Test with actual legacy binaries.
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
		this.name    = attr.name    || "";
		this.version = attr.version || "";
		this.path    = attr.path    || "";
	}
	
	
	/**
	 * Determine the availability of GNU's `grog` script.
	 * 
	 * @todo Axe this and port grog(1) to JavaScript.
	 * @return {Promise} Resolves to a boolean indicating availability.
	 * @internal
	 */
	async canUseGrog(){
		return shell.which("grog");
	}
	
	
	/**
	 * Resolve the command for generating PostScript files.
	 *
	 * @example getPostScriptCommand() == ["troff", ["-Tps"], {env}];
	 * @return {Array}
	 * @internal
	 */
	getPostScriptCommand(){
		switch(this.name){
			case TroffType.GROFF:      return ["groff",  ["-Tps"]];
			case TroffType.GROFF_LIKE: return ["troff",  ["-Tps"]];
			case TroffType.HEIRLOOM:   return ["troff",  ["-Tps"]];
			case TroffType.MANDOC:     return ["mandoc", ["-Tps", "-a"]];
			case TroffType.AIX:        return ["troff",  ["-Tpsc"]];
			case TroffType.SOLARIS10:  return ["troff",  []];
			case TroffType.SOLARIS11:  return ["troff",  ["-Tpost"]];
			
			// TODO: Test Plan9
			case TroffType.DWB:
			case TroffType.FRONT:
			case TroffType.PLAN9:{
				const env = {DWBHOME: dirname(dirname(this.path))};
				return ["troff", "-Tpost", env];
			}
		}
		return null;
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
			const which  = await shell.loadFile(join(__dirname, "which.roff"));
			const result = await shell.exec("troff", [], which);
			switch(result && result.stderr.trim()){
				case this.GROFF:    return new TroffType({path, type: this.GROFF_LIKE});
				case this.MANDOC:   return new TroffType({path, type: this.MANDOC});
				case this.HEIRLOOM: return new TroffType({path, type: this.HEIRLOOM});
			}
			
			// Last resort: blindly guess platform-specific troff
			switch(process.platform){
				// IBM AIX/IRIX
				case "aix":
					return new TroffType({path, type: this.AIX});
				
				// Solaris, SmartOS, SunOS
				case "sunos":
					const version = parseFloat(await shell.exec("uname", ["-v"]));
					if(version >= 11 && version < 12) return TroffType({path, version, type: this.SOLARIS11});
					if(version >= 10 && version < 11) return TroffType({path, version, type: this.SOLARIS10});
					break;
			}
			return new TroffType({path, type: this.UNKNOWN});
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
