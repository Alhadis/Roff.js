"use strict";

// Character classes
const ___ = 0;  // Ignored
const HSP = 1;  // Horizontal whitespace
const VSP = 2;  // Vertical whitespace
const SYM = 3;  // ASCII symbols/punctuation
const HSH = 4;  // #
const HYP = 5;  // -
const DOT = 6;  // .
const DIG = 7;  // ASCII digits
const ABC = 8;  // ASCII letters
const _C_ = 9;  // C [xx…]<ws>
const _D_ = 10; // D [x]… (Draw)
const _H_ = 11; // H [n]
const _N_ = 12;
const _V_ = 13;
const _c_ = 14;
const _d_ = 15;
const _f_ = 16;
const _h_ = 17;
const _m_ = 18;
const _n_ = 19;
const _p_ = 20;
const _s_ = 21;
const _t_ = 22;
const _u_ = 23;
const _v_ = 24;
const _w_ = 25;
const _x_ = 26;

// Character class table
const charmap = [/*══════════════════════════════════════════════════════════════════════╗
   ║    0    1    2    3    4    5    6    7    8    9    A    B    C    D    E    F    *║
00 ║*/ ___, ___, ___, ___, ___, ___, ___, ___, ___, HSP, VSP, VSP, VSP, VSP, ___, ___, /*║ 0F
10 ║*/ ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, /*║ 1F
── ╠╪═══════════════════════════════════════════════════════════════════════════════════╪╣ ──
20 ║*/ HSP, SYM, SYM, HSH, SYM, SYM, SYM, SYM, SYM, SYM, SYM, SYM, SYM, HYP, DOT, SYM, /*║ 2F
30 ║*/ DIG, DIG, DIG, DIG, DIG, DIG, DIG, DIG, DIG, DIG, SYM, SYM, SYM, SYM, SYM, SYM, /*║ 3F
40 ║*/ SYM, ABC, ABC, _C_, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, /*║ 4F
50 ║*/ ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, SYM, SYM, SYM, SYM, SYM, /*║ 5F
60 ║*/ SYM, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, /*╜ 6F
70 ╙*/ ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, ABC, SYM, SYM, SYM, SYM, ___];  0x7F


// States
const SOL =  0; // Start of line
const CO0 = -2; // Comment: Begin/Switch
const CO1 =  1; // Comment: Continue
const CC0 =  2; // <TEMP>

const STT = [/*══╶CHARACTER╌CLASSES╴═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ STATES      ║    ___  HSP  VSP  SYM  HSH  HYP  DOT  DIG  ABC  _C_  _D_  _H_  _N_  _V_  _c_  _d_  _f_  _h_  _m_  _n_  _p_  _s_  _t_  _u_  _v_  _w_  _x_ ║
╠═════════════╬══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║         SOL ║*/[ SOL, SOL, SOL, SOL, CO0, SOL, SOL, SOL, SOL, CC0, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║ Comment CO0 ║*/[ CO1, CO1, SOL, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1 ],/*
║         CO1 ║*/[ CO1, CO1, SOL, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1 ],/*
╚═════════════╩════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/];


module.exports = {
	tokenise(input){
		const tokens = [[]];
		const {length} = input;
		let state = SOL;
		for(let i = 0; i < length; ++i){
			const char = input[i];
			const code = input.charCodeAt(i);
			const cc = charmap[code];
			
			const nextState = STT[state][cc];
			if(nextState < 0){
				state = ~nextState;
				tokens.unshift([]);
			}
			else if(nextState === 0 && state){
				state = 0;
				tokens.unshift([]);
			}
			else{
				state = nextState;
				tokens[0].push(char);
			}
		}
		tokens.reverse();
		console.log(tokens);
		return tokens;
	}
};


function ccToString(cc, char){
	const name = {
		[___]: "Ignored",
		[HSP]: "Horizontal whitespace",
		[VSP]: "Vertical whitespace",
		[SYM]: "Symbol",
		[HSH]: "Hash",
		[HYP]: "Hyphen",
		[DOT]: "Dot",
		[DIG]: "ASCII Digit",
		[ABC]: "ASCII Letter",
		[_C_]: "Character C",
		[_D_]: "Character D",
		[_H_]: "Character H",
		[_N_]: "Character N",
		[_V_]: "Character V",
		[_c_]: "Character c",
		[_d_]: "Character d",
		[_f_]: "Character f",
		[_h_]: "Character h",
		[_m_]: "Character m",
		[_n_]: "Character n",
		[_p_]: "Character p",
		[_s_]: "Character s",
		[_t_]: "Character t",
		[_u_]: "Character u",
		[_v_]: "Character v",
		[_w_]: "Character w",
		[_x_]: "Character x",
	}[cc];
	console.log(`${char}\t${cc}\t${name}`);
}
