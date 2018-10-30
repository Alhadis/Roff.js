import {exec, which} from "./utils.mjs";


export default class TroffAdapter {
	
	/**
	 * Initialise a driver for interfacing with troff(1).
	 *
	 * @param {String} path - Path to the `troff` executable
	 * @param {Object} [attr={}] - Program capabilities and metadata
	 * @constructor
	 */
	constructor(path, attr = {}){
		if(!path){
			const reason = "Cannot initialise without executable path";
			throw new TypeError(`[TroffAdapter::constructor] ${reason}`);
		}
		this.path    = path;
		this.flavour = String(attr.flavour || "unknown");
		this.version = String(attr.version || "");
		
		// Populate program lists
		for(const list of ["preprocessors", "postprocessors", "utils"]){
			this[list] = Object.create(null);
			if(!attr[list]) continue;
			for(const program of attr[list]){
				if(!program) continue;
				this[list][program.name] = program;
			}
		}
	}
	
	
	/**
	 * Identify the troff(1) implementation used by the host system.
	 *
	 * @throws {ReferenceError} If no troff-like utility could be found
	 * @return {TroffAdapter}
	 * @public
	 */
	static async resolveDefault(){
		let prog = null;
		const preprocessors = [];
		const postprocessors = [];
		const utils = [];
		
		// Prefer Groff over other implementations
		if(prog = await this.locate("groff")){
			prog.flavour = "groff";
			utils.push(...await Promise.all([
				this.locate("grog"),
				this.locate("lexgrog"),
			]));
			postprocessors.push(...await Promise.all([
				this.locate("grodvi"),
				this.locate("grolbp"),
				this.locate("grolj4"),
				this.locate("gropdf"),
				this.locate("grops"),
				this.locate("grotty"),
			]));
		}
		
		// Traditional Troff/Nroff
		else if(prog = await this.locate("troff")){
			const result = await exec(prog.path, [`${__dirname}/which.roff`]);
			postprocessors.push(...await Promise.all([
				this.locate("dpost"),
				this.locate("dhtml"),
			]));
			switch(result.stderr.trim()){
				
				// Heirloom Doctools
				case "heirloom":
					prog.flavour = "heirloom";
					break;
				
				// Groff-like implementation not installed as `groff`
				case "groff":
					prog.flavour = "groff-like";
					break;
				
				default: {
					const dwbv = await which("dwbv");
					
					// Documenter's Workbench
					if(dwbv || /([/\\])dwb\1bin\1troff$/i.test(prog.path)){
						prog.flavour = "dwb";
						prog.version = dwbv ? (await exec(dwbv)).stdout : "";
						preprocessors.push(await this.locate("xpand"));
						utils.push(await this.locate("picasso"));
					}
					
					// Ports of Solaris 10, 9front and Plan 9 troffs
					else if(/([/\\])(sunroff|9froff|p9roff)\1bin\1/i.test(prog.path))
						switch(RegExp.lastParen){
							case "9froff":  prog.flavour = "9front";  break;
							case "p9roff":  prog.flavour = "plan9";   break;
							case "sunroff": prog.flavour = "solaris"; prog.version = "10";
						}
					
					// Blindly guess platform-specific troff
					else switch(process.platform){
						case "aix":
							prog.flavour = "aix";
							break;
						case "sunos":
							prog.flavour = "solaris";
							prog.version = (await exec("uname", ["-v"])).stdout.trim();
							break;
					}
				}
			}
		}
		
		// OpenBSD/mandoc(1)
		else if(prog = await this.locate("mandoc"))
			prog.flavour = "mandoc";
		
		// Raise an exception if literally nothing is available
		else{
			const reason = "Unable to locate Troff or Troff-like utility";
			throw new ReferenceError(`[TroffAdapter::resolveDefault] ${reason}`);
		}
		
		if(null !== prog){
			preprocessors.push(...await this.locatePreprocessors());
			return new TroffAdapter(prog.path, {...prog, preprocessors, postprocessors, utils});
		}
	}
	
	
	/**
	 * Retrieve information about an executable in the host's $PATH.
	 *
	 * @example locate("grep") => {
	 *    name: "grep",
	 *    path: "/usr/bin/grep",
	 *    version: "2.5.1-FreeBSD",
	 * };
	 * @param {String} name - Program's executable name
	 * @param {String[]} [aliases=[]] - Other names the program's known by
	 * @param {Boolean} [testVersion=true] - Extract version info
	 * @return {Object} An object if program exists; otherwise, null
	 * @internal
	 */
	static async locate(name, aliases = [], testVersion = true){
		const find = async paths => paths.length
			? (await which(paths.shift())) || find(paths)
			: null;
		const path = await find([name, ...aliases]);
		
		if(!path)
			return null;
		
		if(testVersion){
			const {code, stdout} = await exec(path, ["--version"], "");
			if(!code && /\bv?(\d+\.\d+(?:\.\d+)*(?:-\S+)?)\b/.test(stdout))
				return {name, path, version: RegExp.lastParen};
		}
		
		return {name, path};
	}
	
	
	/**
	 * Locate standard troff(1) processors in the host's $PATH.
	 * @internal
	 * @async
	 */
	static locatePreprocessors(){
		return Promise.all([
			this.locate("eqn", ["geqn"]),
			this.locate("grn", ["ggrn"]),
			this.locate("tbl", ["gtbl"]),
			this.locate("pic", ["gpic"]),
			this.locate("refer", ["grefer"]),
			this.locate("soelim", ["gsoelim"]),
			this.locate("preconv"),
			this.locate("grap"),
			this.locate("neqn"),
		]);
	}
}
