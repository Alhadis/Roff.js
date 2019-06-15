import {readFile}      from "../../utils/env-shims.mjs";
import {resolveManRef} from "../../utils/general.mjs";
import {exec, which}   from "../../utils/shell.mjs";
import {unzip}         from "./unzip.mjs";


/**
 * Driver for interfacing with the host's man(1) implementation.
 * @public
 * @class
 */
export default class ManAdapter {
	
	/**
	 * Initialise an adapter for a known man(1) executable.
	 * @param {String} path - Location of `man` binary.
	 * @param {Object} [attr={}]
	 * @constructor
	 */
	constructor(path, attr = {}){
		this.path     = String(path || "");
		this.cache    = new Map();
		this.optAll   = attr.optAll   || "-a";
		this.optWhich = attr.optWhich || "-w";
		this.loaded   = false;
		this.loadPromise = (async () => {
			await this.loadVersion();
			this.loaded = true;
			return this;
		})();
	}
	
	
	/**
	 * Initialise an adapter for the host's primary `man` executable.
	 * @return {ManAdapter}
	 * @public
	 */
	static async loadDefault(){
		return this.default = this.default || new this(await which("man")).loadPromise;
	}
	
	
	/**
	 * Extract basic version info from `man --version` output.
	 * @internal
	 */
	async loadVersion(){
		if(!this.path) return;
		const result = await exec(this.path, ["--version"]);
		const output = result.stdout || result.stderr;
		this.version = !result.code && output
			? output.trim().replace(/^man,?\s+(?:version\s+)?/gi, "")
			: "";
	}
	
	
	/**
	 * Retrieve the paths for a man page.
	 *
	 * @example man.find("grep") => ["/usr/share/man/man1/grep.1"];
	 * @param  {String} name - Topic or title to search for
	 * @param  {String} [section=""] - Section number to restrict search to
	 * @return {String[]}
	 * @public
	 */
	async find(name, section = ""){
		[section, name] = resolveManRef(name, section).reverse();
		let results     = [];
		
		// Reuse a previous lookup
		const cacheKey = name + (section ? `(${section})` : "");
		if(results = this.cache.get(cacheKey))
			return results;
		
		const args     = [this.optAll, this.optWhich, section, name].filter(Boolean);
		const {stdout} = await exec(this.path, args);
		results        = stdout.trim().split(/\n+/);
		this.cache.set(cacheKey, results);
		return results;
	}
	
	
	/**
	 * Load the contents of a man page, taking possible compression into account.
	 *
	 * @param {String} path
	 * @return {String}
	 * @public
	 */
	async load(path){
		let data = await readFile(path, true);
		data = await unzip(data);
		return String(data);
	}
}
