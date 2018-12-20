import {resolveManRef, exec, which} from "./utils.mjs";
import {readFile} from "../postproc/node-shims.mjs";
import {unzip} from "./unzip.mjs";


export default class ManAdapter {
	
	constructor(path, attr = {}){
		this.cache    = new Map();
		this.path     = path || "";
		this.optAll   = attr.optAll   || "-a";
		this.optWhich = attr.optWhich || "-w";
	}
	
	
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
	
	
	async load(path){
		let data = await readFile(path, true);
		data = await unzip(data);
		return String(data);
	}
	
	
	static async resolveDefault(){
		let path = "";
		
		if(path = await which("man")){
			return new ManAdapter(path);
		}
	}
}
