import {exec, which} from "../utils.mjs";
import * as tmacs    from "./macro-packages.mjs";


/**
 * Driver for interfacing with host's grog(1) executable.
 * Provides a modest fallback if utility is unavailable.
 * @public
 * @class
 */
export default class GrogAdapter {
	
	/**
	 * Initialise an adapter for a (possibly nonexistent) grog(1) binary.
	 * @param {String} [path=""] - Path of physical grog executable
	 * @constructor
	 */
	constructor(path){
		this.path = String(path || "");
	}
	

	/**
	 * Initialise an adapter for the host's main `grog` executable.
	 * @return {GrogAdapter}
	 * @public
	 */
	static async loadDefault(){
		return this.default = this.default || new this(await which("grog"));
	}
	
	
	/**
	 * Determine the most appropriate options to format Roff source.
	 *
	 * @example grog.guessOptions(".TH TBL") => [["groff", "-man", "-t", "-Tps"]];
	 * @param  {String}  input                - Unprocessed Roff source
	 * @param  {String}  [device="ps"]        - Postprocessor being used
	 * @param  {Object}  [options={}]         - Additional options passed to grog(1)
	 * @param  {Boolean} [options.compatMode] - Enable compatibility mode
	 * @param  {Boolean} [options.ligatures]  - Force ligatures to be used
	 * @return {String[]}
	 * @public
	 */
	async guessOptions(input, device = "ps", options = {}){
		if(this.path){
			const args = ["-T" + device];
			options.compatMode && args.push("-C");
			options.ligatures  && args.push("--ligatures");
			options = this.splitPipeline((await exec(this.path, args, input)).stdout);
			options[options.length - 1] = options[options.length - 1]
				.filter(arg => arg && !/^-(?:-ligatures)?$/.test(arg));
			return options;
		}
		
		// Attempt to guess options ourselves if grog(1) is unavailable
		const pipe = new Set();
		let opts = new Set(/^[.']\\" ([egGjJpRst]+)/.test(input)
			? RegExp.$1.split("").map(s => "-" + s)
			: []);
		
		input = input
			.replace(/^[.'][ \t]*(?:\.[ \t*])?\\["#].*$/gm, "")
			.replace(/\\\n/g, "")
			.replace(/^(?!)[.'].*\n/gm, "");
		
		const macroDefs = new Set(); // User-defined macros
		const macroUses = {};        // Uses per macro
		const tmacRanks = {};        // Total macro-uses per tmac
		
		for(const line of input.split(/\n+/)){
			if(/^[.'](?:\s*do)?\s*(?:m?so|PS\s*<|SO_START)/.test(line))
				opts.add("-s"); // soelim
			
			// Record macro definition
			else if(/^[.']\s*de1?\s+([^\s\\]+)/.test(line))
				macroDefs.add(RegExp.$1);
			
			else if(/^[.']\s*([^\s\\]+)/.test(line)){
				const {$1} = RegExp;
				if(macroDefs.has($1)) continue;
				switch($1){
					case "PS":
					case "PF":
					case "PE":       opts.add("-p");        break; // pic
					case "cstart":   opts.add("-j");        break; // chem
					case "EE":
					case "EQ":       opts.add("-e");        break; // eqn
					case "G1":       opts.add("-G");        break; // grap
					case "GS":       opts.add("-g");        break; // grn
					case "IS":       opts.add("-J");        break; // gideal
					case "Perl":     pipe.add("gperl");     break; // gperl
					case "pinyin":   pipe.add("gpinyin");   break; // gpinyin
					case "lilypond": pipe.add("glilypond"); break; // glilypond
					case "R1":       opts.add("-R");        break; // refer
					case "TE":
					case "TS":       opts.add("-t");        break; // tbl
					default:
						for(const key in tmacs)
							if(-1 !== tmacs[key].indexOf($1)){
								macroUses[$1]  = (macroUses[$1]  || 0) + 1;
								tmacRanks[key] = (tmacRanks[key] || 0) + 1;
							}
				}
			}
			/begin\s+chem\s*$/.test(line) && opts.add("-j");
		}
		const [tmac] = Object.keys(tmacRanks).sort((a, b) => {
			if(tmacRanks[a] > tmacRanks[b]) return -1;
			if(tmacRanks[a] < tmacRanks[b]) return 1;
			return 0;
		});
		tmac && opts.add("-" + tmac);
		opts.add("-T" + device);
		opts = [["groff", ...opts]];
		pipe.size && opts.unshift([...pipe].map(pipe => [pipe]));
		return opts;
	}
	
	
	/**
	 * Parse a string containing one or more piped commands.
	 *
	 * @example grog.parsePipeline("eqn | groff -Tps") == [["eqn"], ["groff", "-Tps"]];
	 * @param {String} input
	 * @return {String[]}
	 * @internal
	 */
	splitPipeline(input){
		const all = [[]];
		let pipe = all[0];
		let quote = "";
		let token = "";
		let escaped = false;
		
		const {length} = input;
		for(let i = 0; i < length; ++i){
			const char = input[i];
			if(escaped){
				token += char;
				escaped = false;
				continue;
			}
			
			if(!quote && "|" === char){
				token && pipe.push(token + "");
				all.push(pipe = []);
				token = "";
				continue;
			}
			
			// Argument delimiter: terminate token if unquoted
			if(!quote && -1 !== " \t\n".indexOf(char)){
				token && pipe.push(token + "");
				token = "";
				continue;
			}
			
			// Escape sequence: treat next character literally
			if("\\" === char){
				escaped = true;
				continue;
			}
			
			// Quote marks
			else if((!quote || char === quote) && -1 !== "'\"`".indexOf(char)){
				quote = quote === char ? "" : char;
				if(!token) token = new String(""); // Hack to make empty token truthy
				continue;
			}
			
			token += char;
		}
		token && pipe.push(token + "");
		return all;
	}
}
