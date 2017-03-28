"use strict";

const __ = -1; // Error
const CD =  0; // Character data
const EM =  1; // !
const QM =  2; // ?
const NU =  3; // #
const CA =  4; // ^
const _$ =  5; // $
const AM =  6; // &
const SQ =  7; // '
const GS =  8; // (
const GE =  9; // )
const PL = 10; // +
const AS = 11; // *
const HY = 12; // -
const FS = 13; // /
const PI = 14; // |
const ES = 15; // \
const Do = 16; // .
const CO = 17; // :
const EQ = 18; // =
const LT = 19; // <
const GT = 20; // >
const CS = 21; // [
const CE = 22; // ]
const BL = 23; // {
const BR = 24; // }
const NO = 25; // 1-9
const _0 = 26;
const _A = 27;
const _B = 28;
const _C = 29;
const _D = 30;
const _E = 31;
const _F = 32;
const _G = 33;
const _H = 34;
const _I = 35;
const _J = 36;
const _K = 37;
const _L = 38;
const _M = 39;
const _N = 40;
const _O = 41;
const _P = 42;
const _Q = 43;
const _R = 44;
const _S = 45;
const _T = 46;
const _U = 47;
const _V = 48;
const _W = 49;
const _X = 50;
const _Y = 51;
const _Z = 52;
const _a = 53;
const _b = 54;
const _c = 55;
const _d = 56;
const _e = 57;
const _f = 58;
const _g = 59;
const _h = 60;
const _i = 61;
const _j = 62;
const _k = 63;
const _l = 64;
const _m = 65;
const _n = 66;
const _o = 67;
const _p = 68;
const _q = 69;
const _r = 70;
const _s = 71;
const _t = 72;
const _u = 73;
const _v = 74;
const _w = 75;
const _x = 76;
const _y = 77;
const _z = 78;


// Character class table
const charmap = [/*══════════════════════════════════════════════════════╗
   ║   0   1   2   3   4   5   6   7   8   9   A   B   C   D   E   F    *║
00 ║*/ CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, /*║ 0F
10 ║*/ CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, CD, /*║ 1F
── ╠╪═══════════════════════════════════════════════════════════════════╪╣ ──
20 ║*/ CD, EM, CD, NU, _$, CD, AM, SQ, GS, GE, AS, PL, CD, HY, Do, FS, /*║ 2F
30 ║*/ _0, NO, NO, NO, NO, NO, NO, NO, NO, NO, CO, CD, LT, EQ, GT, QM, /*║ 3F
40 ║*/ CD, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, /*║ 4F
50 ║*/ _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, CS, ES, CE, CA, CD, /*║ 5F
60 ║*/ CD, _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, /*╜ 6F
70 ╙*/ _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, BL, PI, BR, CD, CD];  0x7F


// Symbol types
const cd  =  0; // CDATA
const g0  =  1; // Group: (
const g1  =  2; //        (        Capturing
const g2  =  3; //        (?
const g3  =  4; //        (?:  Non-capturing
const g4  =  5; //        (?=      Lookahead
const g5  =  6; //        (?!      Lookahead
const g6  =  7; //        (?<
const g7  =  8; //        (?<=    Lookbehind
const g8  =  9; //        (?<!    Lookbehind
const g9  = 10; //        (?>         Atomic
const gA  = 13; //        (?#        Comment
const gc  = 14; // Close: )


// State transition table
const STT =[//  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78
/*         │   CD  !  ?  #  ^  $  &  '  (  )  +  *  -  /  |  \  .  :  =  <  >  [ ]  {  }  \d  0  A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P  Q  R  S  T  U  V  W  X  Y  Z  a  b  c  d  e  f  g  h  i  j  k  l  m  n  o  p  q  r  s  t  u  v  w  x  y  z
/*│cd CDATA│*/[cd,cd,cd,cd,cd,cd,cd,cd,g0,cd,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd,cd],
/*│g0 (    │*/[g1,g1,g2,g1,g1,g1,g1,g1,-3,-2,g1,g1,g1,g1,__,__,__,__,__,__,__,__,__,__,__,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1],
/*│g1 (   )│*/[g1,g1,g1,g1,g1,g1,g1,g1,g0,-2,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1,g1],
/*│g2 (?   │*/[g1,g5,g1,gA,g1,g1,g1,g1,g0,-2,__,__,__,__,__,__,__,__,g4,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*│g3 (?: )│*/[g3,g3,g3,g3,g3,g3,g3,g3,g0,-2,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*│g4 (?= )│*/[g4,g4,g4,g4,g4,g4,g4,g4,g0,-2,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*│g5 (?! )│*/[g5,g5,g5,g5,g5,g5,g5,g5,g0,-2,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*│g6 (?<  │*/[g1,g8,g1,g1,g1,g1,g1,g1,g0,-2,__,__,__,__,__,__,__,__,g7,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*│g7 (?<=)│*/[g7,g7,g7,g7,g7,g7,g7,g7,g0,-2,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*│g8 (?<!)│*/[g8,g8,g8,g8,g8,g8,g8,g8,g0,-2,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*│g9 (?> )│*/[g9,g9,g9,g9,g9,g9,g9,g9,g0,-2,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
];


const ACTION_SQUASH = -2;
const ACTION_REPEAT = -3;

module.exports = {
	
	tokenise(input){
		const stack  = [];
		let data     = [];
		let state    = 0;
		
		const {length} = input;
		for(let i = 0; i < length; ++i){
			const chr = input[i];
			const chrClass = charmap[chr.charCodeAt(0)];
			const nextState = STT[state][chrClass];
			
			switch(nextState){
				// Unchanged state: Continue collecting lexeme
				case state:
					data.push(chr);
					break;
				
				// Altered state: Push new state onto stack
				default:
					if(nextState >= 0){
						data.push(chr);
						stack.push([state, data]);
						state = nextState;
						data = [];
						break;
					}
				
				// Unchanged state, but instructed by table to push a new state anyway
				case -3:
					stack.push([state, data]);
					data = [];
					break;
				
				// Instruction from transition table: Squash last state
				case -2:
					const squashedData = [...stack.pop()[1], ...data];
					const prevState = stack[stack.length - 1];
					prevState[1].push([state, squashedData]);
					state = 0;
					break;
			}
		}
		
		return stack;
	}
};
