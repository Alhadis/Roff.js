"use strict";

// Character classes
const ___ = 0;  // Ignored
const HSP = 1;  // Horizontal whitespace
const VSP = 2;  // Vertical whitespace
const SYM = 3;  // ASCII symbols/punctuation
const UND = 4;  // _
const HSH = 5;  // #
const HYP = 6;  // -
const DOT = 7;  // .
const DIG = 8;  // ASCII digits
const ABC = 9;  // ASCII letters
const _C_ = 10; // C [xx…]<ws>
const _D_ = 11; // D [x]… (Draw)
const _H_ = 12; // H [n]
const _N_ = 13;
const _V_ = 14;
const _c_ = 15;
const _d_ = 16;
const _f_ = 17;
const _h_ = 18;
const _m_ = 19;
const _n_ = 20;
const _p_ = 21;
const _s_ = 22;
const _t_ = 23;
const _u_ = 24;
const _v_ = 25;
const _w_ = 26;
const _x_ = 27;

// Character class table
const charmap = [/*══════════════════════════════════════════════════════════════════════╗
   ║    0    1    2    3    4    5    6    7    8    9    A    B    C    D    E    F    *║
00 ║*/ ___, ___, ___, ___, ___, ___, ___, ___, ___, HSP, VSP, VSP, VSP, VSP, ___, ___, /*║ 0F
10 ║*/ ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, /*║ 1F
── ╠╪═══════════════════════════════════════════════════════════════════════════════════╪╣ ──
20 ║*/ HSP, SYM, SYM, HSH, SYM, SYM, SYM, SYM, SYM, SYM, SYM, SYM, SYM, HYP, DOT, SYM, /*║ 2F
30 ║*/ DIG, DIG, DIG, DIG, DIG, DIG, DIG, DIG, DIG, DIG, SYM, SYM, SYM, SYM, SYM, SYM, /*║ 3F
40 ║*/ SYM, ABC, ABC, _C_, _D_, ABC, ABC, ABC, _H_, ABC, ABC, ABC, ABC, ABC, _N_, ABC, /*║ 4F
50 ║*/ ABC, ABC, ABC, ABC, ABC, ABC, _V_, ABC, ABC, ABC, ABC, SYM, SYM, SYM, SYM, UND, /*║ 5F
60 ║*/ SYM, ABC, ABC, _c_, _d_, ABC, _f_, ABC, _h_, ABC, ABC, ABC, ABC, _m_, _n_, ABC, /*╜ 6F
70 ╙*/ _p_, ABC, ABC, _s_, _t_, _u_, _v_, _w_, _x_, ABC, ABC, SYM, SYM, SYM, SYM, ___];  0x7F


// Actions
const ERR = -1; // Throw error
const CO0 = -2; // Switch: Comment
const XX0 = -3; // Switch: X (Device control)
const PP0 = -4; // Switch: `p` command

// States
const SOL = 0; // Start of line
const CO1 = 1; // Comment
const XX1 = 2; // X/Device control
const PP1 = 3; // p[n] # Set page to [n]

const STT = [/*══╶CHARACTER╌CLASSES╴══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ STATES      ║    ___  HSP  VSP  SYM  UND  HSH  HYP  DOT  DIG  ABC  _C_  _D_  _H_  _N_  _V_  _c_  _d_  _f_  _h_  _m_  _n_  _p_  _s_  _t_  _u_  _v_  _w_  _x_ ║
╠═════════════╬═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║         SOL ║*/[ SOL, SOL, SOL, SOL, SOL, CO0, SOL, SOL, SOL, SOL, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, PP0, ___, ___, ___, ___, ___, XX0 ],/*
║ Comment CO1 ║*/[ CO1, CO1, SOL, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1 ],/*
║         XX1 ║*/[ XX1, XX1, SOL, XX1, XX1, CO0, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1 ],/*
║         PP1 ║*/[ PP1, PP1, SOL, SOL, SOL, SOL, SOL, SOL, PP1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║             ║*/[ ],/*
║             ║*/[ ],/*
╚═════════════╩═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/];


module.exports = {
	tokenise(input){
		const tokens = [];
		const {length} = input;
		let state = SOL;
		for(let i = 0; i < length; ++i){
			const char = input[i];
			const code = input.charCodeAt(i);
			const cc = charmap[code];
			
			const nextState = STT[state][cc];
			if(nextState < 0){
				state = ~nextState;
				tokens.unshift([nextState]);
			}
			else{
				state = nextState;
				if(0 !== state)
					tokens[0].push(char);
			}
		}
		return tokens.reverse();
	},
	
	list(tokens){
		const RESET = "\x1B[0m";
		const GREEN = "\x1B[38;5;2m";
		const RED   = "\x1B[38;5;1m";
		const BLUE  = "\x1B[38;5;27m";
		console.log(tokens);
		for(let [name, ...data] of tokens){
			name = {
				[CO0]: RESET + GREEN + "#",
				[XX0]: RESET + RED   + "x",
				[PP0]: RESET + BLUE  + "Begin page:",
			}[name];
			const line = `${name} ${data.join("").trim()}`;
			process.stdout.write(line + RESET + "\n");
		}
	},
};
