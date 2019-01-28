import Adapter from "../adapter.mjs";
import {resolveManRef} from "../utils.mjs";
import {readFile} from "../../postproc/node-shims.mjs";
import {unzip} from "./unzip.mjs";


export default class ManAdapter extends Adapter {
	
	static get allowMissing(){
		return true;
	}
	
	constructor(path, attr = {}){
		super(path);
		this.cache    = new Map();
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
		const {stdout} = await this.exec(args);
		results        = stdout.trim().split(/\n+/);
		this.cache.set(cacheKey, results);
		return results;
	}
	
	
	async load(path){
		let data = await readFile(path, true);
		data = await unzip(data);
		return String(data);
	}
}
