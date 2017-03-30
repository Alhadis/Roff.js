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
const _g_ = 18;
const _h_ = 19;
const _k_ = 20;
const _m_ = 21;
const _n_ = 22;
const _p_ = 23;
const _r_ = 24;
const _s_ = 25;
const _t_ = 26;
const _u_ = 27;
const _v_ = 28;
const _w_ = 29;
const _x_ = 30;

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
60 ║*/ SYM, ABC, ABC, _c_, _d_, ABC, _f_, _g_, _h_, ABC, ABC, _k_, ABC, _m_, _n_, ABC, /*╜ 6F
70 ╙*/ _p_, ABC, _r_, _s_, _t_, _u_, _v_, _w_, _x_, ABC, ABC, SYM, SYM, SYM, SYM, ___];  0x7F


// Transitions
const CO0 = -2;  // # Comment
const XX0 = -3;  // x Device control
const PP0 = -4;  // p
const SS0 = -5;  // s
const FF0 = -6;  // f
const Cc0 = -7;  // c
const CC0 = -9;  // C
const NN0 = -11; // N
const HH0 = -12; // H
const VV0 = -13; // V
const Hh0 = -14; // h
const Vv0 = -15; // v
const JP0 = -16; // Jump and print
const Nn0 = -19; // n
const WW0 = -22; // w
const DD0 = -23; // D Drawing command
const MM0 = -24; // Colour scheme
const TT0 = -41; // t
const UU0 = -45; // u

// States
const SOL = 0;  // Start of line
const CO1 = 1;  // Comment
const XX1 = 2;  // X/Device control
const PP1 = 3;  // p[n]    # Set page to [n]
const SS1 = 4;  // s[n]    # Set point-size to [n]
const FF1 = 5;  // f[n]    # Set font to [n]
const Cc1 = 6;  // c[c]    # Print ASCII character [c]
const Cc2 = 7;  //         # Argument given above
const CC1 = 8;  // C[xx…]  # Print character [xx]
const CC2 = 9;  //         # Argument given above
const NN1 = 10; // N[n]    # Print character [n]
const HH1 = 11; // H[n]    # Move to X (Absolute)
const VV1 = 12; // V[n]    # Move to V (Absolute)
const Hh1 = 13; // h[n]    # Move to X (Relative)
const Vv1 = 14; // v[n]    # Move to V (Relative)
const JP1 = 15; // [nn][c] # Jump to [nn] and print [c]
const JP2 = 16; //         #   Arg 1:[n ]
const JP3 = 17; //         #   Arg 1:[ n]
const Nn1 = 18; // n[n][n] # EOL:  [n] before/[n] after
const Nn2 = 19; //         # Arg 1:[n]
const Nn3 = 20; //         #            Arg 2:[n]
const WW1 = 21; // w       # Paddable word space
const DD1 = 22; // D       # Drawing function
const MM1 = 23; // m       # Colour scheme
const mc0 = 24; // mc[cmy] # c: CMY
const mc1 = 25; //   [c  ] #    - Arg 1: Cyan
const mc2 = 26; //   [ m ] #    - Arg 2: Magenta
const mc3 = 27; //   [  y] #    - Arg 3: Yellow
const md0 = 28; // md      # d: Default
const mg0 = 29; // mg[g]   # g: Greyscale
const mg1 = 30; //   [g]   #   - Arg 1: Grey
const mk0 = 31; // mk[cmyk]# k: CYMK
const mk1 = 32; //   [c   ]#   - Arg 1: Cyan
const mk2 = 33; //   [ m  ]#   - Arg 2: Magenta
const mk3 = 34; //   [  y ]#   - Arg 3: Yellow
const mk4 = 35; //   [   k]#   - Arg 4: Black
const mr0 = 36; // mr[rgb] # r: RGB
const mr1 = 37; //   [r  ] #   - Arg 1: Red
const mr2 = 38; //   [ g ] #   - Arg 2: Green
const mr3 = 39; //   [  b] #   - Arg 3: Blue
const TT1 = 40; // t[x][n] # Print text [x] [n?]
const TT2 = 41; //  [x]    #   - Arg 1: [x]
const TT3 = 42; //         #   - [x]<- … ->[n] ?
const TT4 = 43; //     [n] #   - Arg 2: [n]
const UU1 = 44; // u[n][x] # Tracking-enabled version of `t`
const UU2 = 45; //  [n]    #   - Arg 1: [n]
const UU3 = 46; //         #   - [n]<- … ->[x]
const UU4 = 47; //     [x] #   - Arg 2: [x]



const STT = [/*══╶CHARACTER╌CLASSES╴═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ STATES      ║    ___  HSP  VSP  SYM  UND  HSH  HYP  DOT  DIG  ABC  _C_  _D_  _H_  _N_  _V_  _c_  _d_  _f_  _g_  _h_  _k_  _m_  _n_  _p_  _r_  _s_  _t_  _u_  _v_  _w_  _x_ ║
╠═════════════╬══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Start   ___ ║*/[ ___, ___, ___, ___, ___, CO0, ___, ___, JP0, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, TT0, UU0, Vv0, WW0, XX0 ],/*
║ Comment CO1 ║*/[ CO1, CO1, ___, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1 ],/*
║ Command XX1 ║*/[ XX1, XX1, ___, XX1, XX1, CO0, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1, XX1 ],/*
║         PP1 ║*/[ PP1, PP1, ___, ___, ___, CO0, ___, ___, PP1, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         SS1 ║*/[ SS1, SS1, ___, ___, ___, CO0, ___, ___, SS1, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         FF1 ║*/[ FF1, FF1, ___, ___, ___, CO0, ___, ___, FF1, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         Cc1 ║*/[ Cc1, Cc1, ___, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2 ],/*
║         Cc2 ║*/[ ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         CC1 ║*/[ CC1, CC1, ___, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2 ],/*
║         CC2 ║*/[ CC2, ___, ___, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2 ],/*
║         NN1 ║*/[ NN1, NN1, ___, ___, ___, CO0, NN1, ___, NN1, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         HH1 ║*/[ HH1, HH1, ___, ___, ___, CO0, HH1, HH1, HH1, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         VV1 ║*/[ VV1, VV1, ___, ___, ___, CO0, VV1, VV1, VV1, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         Hh1 ║*/[ Hh1, Hh1, ___, ___, ___, CO0, Hh1, Hh1, Hh1, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         Vv1 ║*/[ Vv1, Vv1, ___, ___, ___, CO0, Vv1, Vv1, Vv1, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         JP1 ║*/[ JP1, ___, ___, ___, ___, CO0, ___, ___, JP2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         JP2 ║*/[ JP2, ___, ___, JP3, JP3, CO0, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3 ],/*
║         JP3 ║*/[ JP3, ___, ___, ___, ___, CO0, ___, ___, JP0, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         Nn1 ║*/[ Nn1, ___, ___, ___, ___, CO0, ___, ___, Nn2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         Nn2 ║*/[ Nn2, Nn3, ___, ___, ___, ___, Nn2, Nn2, Nn2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         Nn3 ║*/[ Nn3, ___, ___, ___, ___, CO0, Nn3, Nn3, Nn3, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         WW1 ║*/[ ___, ___, ___, ___, ___, CO0, ___, ___, JP0, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         DD1 ║*/[ DD1, DD1, ___, DD1, DD1, CO0, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1 ],/*
║         MM1 ║*/[ MM1, MM1, ___, ___, ___, CO0, ___, ___, ___, ___, ___, ___, ___, ___, ___, mc0, md0, ___, mg0, ___, mk0, ___, ___, ___, mr0, ___, ___, ___, ___, ___, ___ ],/*
║         mc0 ║*/[ mc0, mc0, ___, ___, ___, CO0, ___, ___, mc1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mc1 ║*/[ mc1, mc2, ___, ___, ___, CO0, ___, ___, mc1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mc2 ║*/[ mc2, mc3, ___, ___, ___, CO0, ___, ___, mc2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mc3 ║*/[ mc3, ___, ___, ___, ___, CO0, ___, ___, mc3, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         md0 ║*/[ ___, ___, ___, ___, ___, CO0, ___, ___, ___, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         mg0 ║*/[ mg0, mg0, ___, ___, ___, CO0, ___, ___, mg1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mg1 ║*/[ mg1, ___, ___, ___, ___, CO0, ___, ___, mg1, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         mk0 ║*/[ mk0, mk0, ___, ___, ___, CO0, ___, ___, mk1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mk1 ║*/[ mk1, mk2, ___, ___, ___, CO0, ___, ___, mk1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mk2 ║*/[ mk2, mk3, ___, ___, ___, CO0, ___, ___, mk2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mk3 ║*/[ mk3, mk4, ___, ___, ___, CO0, ___, ___, mk3, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mk4 ║*/[ mk4, ___, ___, ___, ___, CO0, ___, ___, mk4, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         mr0 ║*/[ mr0, mr0, ___, ___, ___, CO0, ___, ___, mr1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mr1 ║*/[ mr1, mr2, ___, ___, ___, CO0, ___, ___, mr1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mr2 ║*/[ mr2, mr3, ___, ___, ___, CO0, ___, ___, mr2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mr3 ║*/[ mr3, ___, ___, ___, ___, CO0, ___, ___, mr3, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         TT1 ║*/[ TT1, TT1, ___, ___, ___, TT2, ___, ___, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2 ],/*
║         TT2 ║*/[ TT2, TT3, ___, ___, ___, TT2, ___, ___, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2 ],/*
║         TT3 ║*/[ TT3, TT3, ___, ___, ___, CO0, TT4, ___, TT4, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, TT0, ___, Vv0, WW0, XX0 ],/*
║         TT4 ║*/[ TT4, ___, ___, ___, ___, CO0, TT4, ___, TT4, ___, CC0, DD0, HH0, NN0, VV0, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, TT0, ___, Vv0, WW0, XX0 ],/*
║         UU1 ║*/[ UU1, UU1, ___, ___, ___, CO0, UU2, ___, UU2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         UU2 ║*/[ UU2, UU3, ___, ___, ___, ___, UU4, UU4, UU2, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4 ],/*
║         UU3 ║*/[ UU3, UU3, ___, ___, ___, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4 ],/*
║         UU4 ║*/[ UU4, ___, ___, ___, ___, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4 ],/*
║             ║*/[ ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
╠═════════════╬══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ STATES      ║    ___  HSP  VSP  SYM  UND  HSH  HYP  DOT  DIG  ABC  _C_  _D_  _H_  _N_  _V_  _c_  _d_  _f_  _g_  _h_  _k_  _m_  _n_  _p_  _r_  _s_  _t_  _u_  _v_  _w_  _x_ ║
╚═════════════╩════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/];

module.exports = {
	tokenise(input){
		const tokens = [];
		const {length} = input;
		let state = 0;
		for(let i = 0; i < length; ++i){
			const char = input[i];
			const code = input.charCodeAt(i);
			const cc = charmap[code];
			
			const nextState = STT[state][cc];
			if(nextState < 0){
				state = ~nextState;
				tokens.unshift([nextState]);
				if(JP1 === state)
					tokens[0].push(char);
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
		
		for(let [name, ...data] of tokens){
			if(JP0 === name){
				const letter = data.pop();
				const distance = data.join("").trim();
				process.stdout.write(`Jump right ${distance} and print ${letter}\n`);
				continue;
			}
			data = data.join("").trim();
			if(TT0 === name)
				data = data.replace(/\s+(\d+)$/, GREEN + " $1" + RESET);
			name = {
				[CO0]: RESET + GREEN + "#",
				[XX0]: RESET + RED   + "x",
				[PP0]: RESET + BLUE  + "Begin page:",
				[SS0]: RESET + "Point size:",
				[FF0]: RESET + "Font:",
				[Cc0]: RESET + "Character:",
				[CC0]: RESET + "Character name:",
				[NN0]: RESET + "Character index:",
				[HH0]: RESET + "Move X Absolutely:",
				[VV0]: RESET + "Move V Absolutely:",
				[Hh0]: RESET + "Move X Relatively:",
				[Vv0]: RESET + "Move V Relatively:",
				[Nn0]: RESET + "EOL:",
				[WW0]: RESET + "<< Paddable word-space >>",
				[DD0]: RESET + "Drawing command:",
				[MM0]: RESET + "Foreground colour scheme:",
				[TT0]: RESET + "Print text:",
				[UU0]: RESET + "Print with tracking:",
			}[name];
			const line = `${name} ${data}`;
			process.stdout.write(line + RESET + "\n");
		}
	},
};
