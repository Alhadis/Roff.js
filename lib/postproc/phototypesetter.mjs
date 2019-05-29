import charCodes  from "./tables/cat-codes.mjs";
import glyphNames from "./tables/glyph-names.mjs";


/**
 * Driver for Graphics Systems C/A/T phototypesetter code.
 * @see {@link https://groups.google.com/d/topic/comp.text/IFbbkuI91nA}
 * @class
 */
export default class Phototypesetter {
	
	/**
	 * Instantiate a new C/A/T driver.
	 *
	 * @param {String} [deviceMode="cat"] - Emulated postprocessor
	 * @throws {TypeError} If passed an unsupported/unknown `deviceMode`
	 * @constructor
	 */
	constructor(deviceMode = "cat"){
		this.glyphNames = {};
		for(const key in glyphNames)
			this.glyphNames[glyphNames[key]] = key;
		
		// Determine which postprocessor to emulate
		switch(deviceMode = deviceMode.toLowerCase()){
			// C/A/T device
			case "cat":
				this.deviceName = "cat";
				this.resolution = [432, 1, 3, 1];
				this.fonts = "RIBS".split("");
				break;
			
			// Low-resolution PostScript
			case "post":
				this.deviceName = "post";
				this.resolution = [720, 1, 1, 100];
				this.fonts = "R I B BI CW H HB HX S1 S".split(" ");
				break;
			
			// High-resolution PostScript/PDF
			case "ps":
			case "pdf":
				this.deviceName = deviceMode;
				this.resolution = [72000, 1, 1, 1000];
				this.fonts = ["TR", "TI", "TB", "S"];
				this.glyphNames["−"] = "\\-";
				for(const glyph of '"+=@\\^_`|')
					delete this.glyphNames[glyph];
				break;
			
			// Invalid/unrecognised emulation mode
			default:
				const reason = `[Phototypesetter::constructor] Unsupported device: ${deviceMode}`;
				throw new TypeError(reason);
		}
		
		this.output = `x T ${this.deviceName}\nx res ${this.resolution.slice(0, 3).join(" ")}\nx init\n`;
		this.startPage(1);
		this.handleSizeChange(0x52);
	}
	
	
	/**
	 * Render a bytestream of C/A/T instructions.
	 *
	 * @example cat.process([0x40, 0xEF, 0x60…]);
	 * @param {Buffer|Number[]|String} data
	 * @return {String}
	 * @public
	 */
	process(data){
		data = "string" === typeof data
			? [...data].map(c => c.charCodeAt(0))
			: data;
		
		const {length} = data;
		for(let i = 0; i < length; ++i){
			const code = +data[i];
			
			// Debug mode: Trace each byte before it's processed
			if(this.debug){
				const hex = (code < 17 ? "0" : "") + code.toString(16).toUpperCase();
				this.output += `# [${i}]: ${hex}\n`;
			}
			
			// Ignore null-bytes
			if(!code) continue;
			
			// Terminate processing
			else if(0x49 === code){
				this.output = this.output.replace(/(?:\n[#HVhvxp][^\n]*)+\n*$/, "") + "\nx trailer\nx stop\n";
				break;
			}
			
			// Extension sequence
			else if(0x4B === code)
				switch(data[++i]){
					case 0x01: this.handleLead(64 * data[++i],    true); break; // Big lead
					case 0x02: this.handleEscape(128 * data[++i], true); break; // Big escape
					case 0x03: this.startPage(this.page + 1);            break; // Form-feed
					default: console.error("Bad extension: " + data[i]); break; // Illegal
				}
			
			else if(0x00 === (code & (0xF0 << 2))) this.handleFlash(code);
			else if(0x80 === (code & (0xF0 << 3))) this.handleEscape(code);
			else if(0x60 === (code & (0xF0 << 1))) this.handleLead(code);
			else if(0x50 === (code & (0xF0)))      this.handleSizeChange(code);
			else if(0x40 === (code & (0xF0)))      this.handleControl(code);
			else console.error("Invalid byte: " + code);
		}
		return this.output;
	}
	
	
	/**
	 * Perform a variety of device control functions.
	 * @param {Number} code
	 * @internal
	 */
	handleControl(code){
		switch(+code){
			// Initialise
			case 0x40:
				this.escape = this.lead = 1;
				this.fontHalf = this.rail = this.magazine = this.tilt = 0;
				break;
			
			// Modify state flags
			case 0x41: this.rail     = 0; this.updateFont(); break; // Lower rail
			case 0x42: this.rail     = 1; this.updateFont(); break; // Upper rail
			case 0x44: this.magazine = 0; this.updateFont(); break; // Lower magazine
			case 0x43: this.magazine = 1; this.updateFont(); break; // Upper magazine
			case 0x4F: this.tilt     = 0; this.updateFont(); break; // Tilt down
			case 0x4E: this.tilt     = 1; this.updateFont(); break; // Tilt up
			case 0x45: this.fontHalf = 0; break; // Lower font-half
			case 0x46: this.fontHalf = 1; break; // Upper font-half
			case 0x47: this.escape   = 1; break; // Escape forward
			case 0x48: this.escape   = 0; break; // Escape backward
			case 0x4A: this.lead     = 1; break; // Lead forward
			case 0x4C: this.lead     = 0; break; // Lead backward
		}
	}
	
	
	/**
	 * Perform horizontal motion.
	 * @param {Number} code
	 * @param {Boolean} [big=false]
	 * @internal
	 */
	handleEscape(code, big = false){
		if(!this.doneInitX){
			this.doneInitX = true;
			return;
		}
		const delta = (big ? code : (~code & 0x7F))
			* (this.escape ? 1 : -1)
			* Math.round(this.resolution[0] / 432)
			* Math.round(1 / this.resolution[1]);
		this.x += delta;
		this.output += `h${delta}\n`;
	}
	
	
	/**
	 * Perform vertical motion.
	 * @param {Number} code
	 * @param {Boolean} [big=false]
	 * @internal
	 */
	handleLead(code, big = false){
		if(!this.doneInitY){
			this.doneInitY = true;
			return;
		}
		const delta = (big ? code : (~code & 0x1F))
			* (this.lead ? 1 : -1)
			* Math.round(this.resolution[0] / 432)
			* Math.round(3 / this.resolution[2]);
		if(this.y + delta >= 11 * this.resolution[0]){
			const {x} = this;
			this.startPage(this.page + 1);
			this.output += `H${this.x = x}\n`;
		}
		else{
			this.y += delta;
			this.output += `v${delta}\n`;
		}
	}
	
	
	/**
	 * Draw indexed character from the selected half of the current font.
	 * @param {Number} code
	 * @internal
	 */
	handleFlash(code){
		code &= 0x3F;
		if(code <= 0)
			return console.error("Bad character code: " + code);
		if(this.fontHalf)   code += 64;
		if(4 === this.font) code += 128;
		const char = charCodes[code];
		if(!char)
			return console.error("Unknown character: " + code);
		
		let fontSwitched = true;
		if(4 === this.font && -1 !== '@"\\^`′§‡'.indexOf(char))
			this.output += `f${this.prevFont}\n`;
		else if("☜" === char) this.output += "x font 6 ZDR\nf6\n";
		else if("☞" === char) this.output += "x font 5 ZD\nf5\n";
		else fontSwitched = false;
		this.output += char in this.glyphNames
			? `C${this.glyphNames[char]}\nw`
			: `c${char}\nw`;
		if(fontSwitched)
			this.output += `f${this.font}\n`;
		if(this.debug)
			this.output += "\n";
	}
	
	
	/**
	 * Change the current point-size.
	 * @param {Number} code
	 * @internal
	 */
	handleSizeChange(code){
		const from = this.pointSize;
		const to = {
			0x50: 7,
			0x51: 8,
			0x52: 10,
			0x53: 11,
			0x54: 12,
			0x55: 14,
			0x56: 18,
			0x57: 9,
			0x58: 6,
			0x59: 16,
			0x5A: 20,
			0x5B: 22,
			0x5C: 24,
			0x5D: 28,
			0x5E: 36,
		}[+code] || 0;
		
		if(from === to) return;
		if(to){
			this.pointSize = to;
			this.output += `s${to * this.resolution[3]}\n`;
		}
		else console.error("Invalid point-size: " + code);
	}
	
	
	/**
	 * Signal the beginning of a new page in the output.
	 * @param {Number} index
	 * @internal
	 */
	startPage(index){
		this.page = index;
		this.x = this.y = 0;
		this.output += `p${index}\n`
			+ this.fonts.map((name, position) => `x font ${++position} ${name}\n`).join("")
			+ `f${this.font}\n`;
	}
	
	
	/**
	 * Switch between mounted fonts, depending on turret's position.
	 * @internal
	 */
	updateFont(){
		const font = this.isCAT8
			// 8-font C/A/T
			? this.tilt
				? this.magazine
					? this.rail ? 7 : 5
					: this.rail ? 3 : 1
				: this.magazine
					? this.rail ? 8 : 6
					: this.rail ? 4 : 2
			
			// 4-font C/A/T (default)
			: this.magazine
				? this.rail ? 4 : 3
				: this.rail ? 2 : 1;
		
		if(font !== +this.font){
			this.prevFont = this.font;
			this.output += `f${this.font = font}\n`;
		}
	}
}


Object.assign(Phototypesetter.prototype, {
	debug:      false,
	deviceName: "cat",
	doneInitX:  false,
	doneInitY:  false,
	resolution: null,
	output:     "",
	font:       1,
	fonts:      null,
	isCAT8:     false,
	page:       1,
	pointSize:  0,
	prevFont:   1,
	x:          0,
	y:          0,
	
	// State flags
	escape:     1,   // 0 => Backward  1 => Forward
	lead:       1,   // 0 => Backward  1 => Forward
	fontHalf:   0,   // 0 => Lower     1 => Upper
	rail:       0,   // 0 => Lower     1 => Upper
	magazine:   0,   // 0 => Lower     1 => Upper
	tilt:       0,   // 0 => Lower     1 => Upper
});
