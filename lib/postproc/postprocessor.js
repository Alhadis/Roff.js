// -*- coding: utf-8; truncate-lines: t; -*- vim:set nowrap:
"use strict";

// Character classes
const ___ = 0;  // Ignored
const HSP = 1;  // Horizontal whitespace
const VSP = 2;  // Vertical whitespace
const SYM = 3;  // ASCII symbols/punctuation
const UND = 4;  // _
const HSH = 5;  // #
const HYP = 6;  // -
const PLS = 7;  // +
const DOT = 8;  // .
const DIG = 9;  // ASCII digits
const ABC = 10; // ASCII letters
const _C_ = 11; // C [xx…]<ws>
const _D_ = 12; // D [x]… (Draw)
const _H_ = 13; // H [n]
const _N_ = 14;
const _V_ = 15;
const _X_ = 16;
const _c_ = 17;
const _d_ = 18;
const _f_ = 19;
const _g_ = 20;
const _h_ = 21;
const _k_ = 22;
const _m_ = 23;
const _n_ = 24;
const _p_ = 25;
const _r_ = 26;
const _s_ = 27;
const _t_ = 28;
const _u_ = 29;
const _v_ = 30;
const _w_ = 31;
const _x_ = 32;

// Character class table
const charmap = [/*══════════════════════════════════════════════════════════════════════╗
   ║    0    1    2    3    4    5    6    7    8    9    A    B    C    D    E    F    *║
00 ║*/ ___, ___, ___, ___, ___, ___, ___, ___, ___, HSP, VSP, VSP, VSP, VSP, ___, ___, /*║ 0F
10 ║*/ ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, /*║ 1F
── ╠╪═══════════════════════════════════════════════════════════════════════════════════╪╣ ──
20 ║*/ HSP, SYM, SYM, HSH, SYM, SYM, SYM, SYM, SYM, SYM, SYM, PLS, SYM, HYP, DOT, SYM, /*║ 2F
30 ║*/ DIG, DIG, DIG, DIG, DIG, DIG, DIG, DIG, DIG, DIG, SYM, SYM, SYM, SYM, SYM, SYM, /*║ 3F
40 ║*/ SYM, ABC, ABC, _C_, _D_, ABC, ABC, ABC, _H_, ABC, ABC, ABC, ABC, ABC, _N_, ABC, /*║ 4F
50 ║*/ ABC, ABC, ABC, ABC, ABC, ABC, _V_, ABC, _X_, ABC, ABC, SYM, SYM, SYM, SYM, UND, /*║ 5F
60 ║*/ SYM, ABC, ABC, _c_, _d_, ABC, _f_, _g_, _h_, ABC, ABC, _k_, ABC, _m_, _n_, ABC, /*╜ 6F
70 ╙*/ _p_, ABC, _r_, _s_, _t_, _u_, _v_, _w_, _x_, ABC, ABC, SYM, SYM, SYM, SYM, ___];  0x7F


// Transitions
const CO0 = -2;  // # Comment
const PP0 = -3;  // p
const SS0 = -4;  // s
const FF0 = -5;  // f
const Cc0 = -6;  // c
const CC0 = -8;  // C
const NN0 = -10; // N
const HH0 = -11; // H
const VV0 = -12; // V
const Hh0 = -13; // h
const Vv0 = -14; // v
const JP0 = -15; // Jump and print
const Nn0 = -18; // n
const WW0 = -21; // w
const DD0 = -22; // D Drawing command
const MM0 = -23; // Colour scheme
const TT0 = -40; // t
const UU0 = -44; // u
const XX0 = -48; // x Device control

// States
const SOL = 0;  // Start of line
const CO1 = 1;  // Comment
const PP1 = 2;  // p[n]    # Set page to [n]
const SS1 = 3;  // s[n]    # Set point-size to [n]
const FF1 = 4;  // f[n]    # Set font to [n]
const Cc1 = 5;  // c[c]    # Print ASCII character [c]
const Cc2 = 6;  //         # Argument given above
const CC1 = 7;  // C[xx…]  # Print character [xx]
const CC2 = 8;  //         # Argument given above
const NN1 = 9;  // N[n]    # Print character [n]
const HH1 = 10; // H[n]    # Move to X (Absolute)
const VV1 = 11; // V[n]    # Move to V (Absolute)
const Hh1 = 12; // h[n]    # Move to X (Relative)
const Vv1 = 13; // v[n]    # Move to V (Relative)
const JP1 = 14; // [nn][c] # Jump to [nn] and print [c]
const JP2 = 15; //         #   Arg 1:[n ]
const JP3 = 16; //         #   Arg 1:[ n]
const Nn1 = 17; // n[n][n] # EOL:  [n] before/[n] after
const Nn2 = 18; //         # Arg 1:[n]
const Nn3 = 19; //         #            Arg 2:[n]
const WW1 = 20; // w       # Paddable word space
const DD1 = 21; // D       # Drawing function
const MM1 = 22; // m       # Colour scheme
const mc0 = 23; // mc[cmy] # c: CMY
const mc1 = 24; //   [c  ] #    - Arg 1: Cyan
const mc2 = 25; //   [ m ] #    - Arg 2: Magenta
const mc3 = 26; //   [  y] #    - Arg 3: Yellow
const md0 = 27; // md      # d: Default
const mg0 = 28; // mg[g]   # g: Greyscale
const mg1 = 29; //   [g]   #   - Arg 1: Grey
const mk0 = 30; // mk[cmyk]# k: CYMK
const mk1 = 31; //   [c   ]#   - Arg 1: Cyan
const mk2 = 32; //   [ m  ]#   - Arg 2: Magenta
const mk3 = 33; //   [  y ]#   - Arg 3: Yellow
const mk4 = 34; //   [   k]#   - Arg 4: Black
const mr0 = 35; // mr[rgb] # r: RGB
const mr1 = 36; //   [r  ] #   - Arg 1: Red
const mr2 = 37; //   [ g ] #   - Arg 2: Green
const mr3 = 38; //   [  b] #   - Arg 3: Blue
const TT1 = 39; // t[x][n] # Print text [x] [n?]
const TT2 = 40; //  [x]    #   - Arg 1: [x]
const TT3 = 41; //         #   - [x]<- … ->[n] ?
const TT4 = 42; //     [n] #   - Arg 2: [n]
const UU1 = 43; // u[n][x] # Tracking-enabled version of `t`
const UU2 = 44; //  [n]    #   - Arg 1: [n]
const UU3 = 45; //         #   - [n]<- … ->[x]
const UU4 = 46; //     [x] #   - Arg 2: [x]
const XX1 = 47; // x       # x Start
const XX2 = 48; // x [xx…] # x Name
const XX3 = 49; // x X     # x X
const XX4 = 50; // SOL after `x X`



const STT = [/*══╶CHARACTER╌CLASSES╴═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ STATES      ║    ___  HSP  VSP  SYM  UND  HSH  HYP  PLS  DOT  DIG  ABC  _C_  _D_  _H_  _N_  _V_  _X_  _c_  _d_  _f_  _g_  _h_  _k_  _m_  _n_  _p_  _r_  _s_  _t_  _u_  _v_  _w_  _x_ ║
╠═════════════╬════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Start   ___ ║*/[ ___, ___, ___, ___, ___, CO0, ___, ___, ___, JP0, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, TT0, UU0, Vv0, WW0, XX0 ],/*
║ Comment CO1 ║*/[ CO1, CO1, ___, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1, CO1 ],/*
║ Command PP1 ║*/[ PP1, PP1, ___, ___, ___, CO0, ___, ___, ___, PP1, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         SS1 ║*/[ SS1, SS1, ___, ___, ___, CO0, ___, ___, ___, SS1, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         FF1 ║*/[ FF1, FF1, ___, ___, ___, CO0, ___, ___, ___, FF1, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         Cc1 ║*/[ Cc1, Cc1, ___, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2, Cc2 ],/*
║         Cc2 ║*/[ ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         CC1 ║*/[ CC1, CC1, ___, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2 ],/*
║         CC2 ║*/[ CC2, ___, ___, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2, CC2 ],/*
║         NN1 ║*/[ NN1, NN1, ___, ___, ___, CO0, NN1, ___, ___, NN1, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         HH1 ║*/[ HH1, HH1, ___, ___, ___, CO0, HH1, ___, HH1, HH1, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         VV1 ║*/[ VV1, VV1, ___, ___, ___, CO0, VV1, ___, VV1, VV1, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         Hh1 ║*/[ Hh1, Hh1, ___, ___, ___, CO0, Hh1, ___, Hh1, Hh1, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         Vv1 ║*/[ Vv1, Vv1, ___, ___, ___, CO0, Vv1, ___, Vv1, Vv1, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         JP1 ║*/[ JP1, ___, ___, ___, ___, CO0, ___, ___, ___, JP2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         JP2 ║*/[ JP2, ___, ___, JP3, JP3, CO0, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3, JP3 ],/*
║         JP3 ║*/[ JP3, ___, ___, ___, ___, CO0, ___, ___, ___, JP0, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         Nn1 ║*/[ Nn1, ___, ___, ___, ___, CO0, ___, ___, ___, Nn2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         Nn2 ║*/[ Nn2, Nn3, ___, ___, ___, ___, Nn2, ___, Nn2, Nn2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         Nn3 ║*/[ Nn3, ___, ___, ___, ___, CO0, Nn3, ___, Nn3, Nn3, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         WW1 ║*/[ ___, ___, ___, ___, ___, CO0, ___, ___, ___, JP0, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, ___, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         DD1 ║*/[ DD1, DD1, ___, DD1, DD1, CO0, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1, DD1 ],/*
║         MM1 ║*/[ MM1, MM1, ___, ___, ___, CO0, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, mc0, md0, ___, mg0, ___, mk0, ___, ___, ___, mr0, ___, ___, ___, ___, ___, ___ ],/*
║         mc0 ║*/[ mc0, mc0, ___, ___, ___, CO0, ___, ___, ___, mc1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mc1 ║*/[ mc1, mc2, ___, ___, ___, CO0, ___, ___, ___, mc1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mc2 ║*/[ mc2, mc3, ___, ___, ___, CO0, ___, ___, ___, mc2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mc3 ║*/[ mc3, ___, ___, ___, ___, CO0, ___, ___, ___, mc3, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         md0 ║*/[ ___, ___, ___, ___, ___, CO0, ___, ___, ___, ___, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         mg0 ║*/[ mg0, mg0, ___, ___, ___, CO0, ___, ___, ___, mg1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mg1 ║*/[ mg1, ___, ___, ___, ___, CO0, ___, ___, ___, mg1, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         mk0 ║*/[ mk0, mk0, ___, ___, ___, CO0, ___, ___, ___, mk1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mk1 ║*/[ mk1, mk2, ___, ___, ___, CO0, ___, ___, ___, mk1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mk2 ║*/[ mk2, mk3, ___, ___, ___, CO0, ___, ___, ___, mk2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mk3 ║*/[ mk3, mk4, ___, ___, ___, CO0, ___, ___, ___, mk3, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mk4 ║*/[ mk4, ___, ___, ___, ___, CO0, ___, ___, ___, mk4, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         mr0 ║*/[ mr0, mr0, ___, ___, ___, CO0, ___, ___, ___, mr1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mr1 ║*/[ mr1, mr2, ___, ___, ___, CO0, ___, ___, ___, mr1, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mr2 ║*/[ mr2, mr3, ___, ___, ___, CO0, ___, ___, ___, mr2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         mr3 ║*/[ mr3, ___, ___, ___, ___, CO0, ___, ___, ___, mr3, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, ___, ___, Vv0, WW0, XX0 ],/*
║         TT1 ║*/[ TT1, TT1, ___, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2 ],/*
║         TT2 ║*/[ TT2, TT3, ___, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2, TT2 ],/*
║         TT3 ║*/[ TT3, TT3, ___, ___, ___, CO0, TT4, ___, ___, TT4, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, TT0, ___, Vv0, WW0, XX0 ],/*
║         TT4 ║*/[ TT4, ___, ___, ___, ___, CO0, TT4, ___, ___, TT4, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, TT0, ___, Vv0, WW0, XX0 ],/*
║         UU1 ║*/[ UU1, UU1, ___, ___, ___, CO0, UU2, ___, ___, UU2, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
║         UU2 ║*/[ UU2, UU3, ___, UU4, UU4, UU4, UU4, UU4, UU4, UU2, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4 ],/*
║         UU3 ║*/[ UU3, UU3, ___, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4 ],/*
║         UU4 ║*/[ UU4, ___, ___, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4, UU4 ],/*
║ Device  XX1 ║*/[ XX1, XX1, ___, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX3, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2 ],/*
║         XX2 ║*/[ XX2, XX2, ___, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2, XX2 ],/*
║         XX3 ║*/[ XX3, XX3, XX4, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3, XX3 ],/*
║         XX4 ║*/[ ___, ___, ___, ___, ___, CO0, ___, XX3, ___, JP0, ___, CC0, DD0, HH0, NN0, VV0, ___, Cc0, ___, FF0, ___, Hh0, ___, MM0, Nn0, PP0, ___, SS0, TT0, UU0, Vv0, WW0, XX0 ],/*
║             ║*/[ ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___, ___ ],/*
╠═════════════╬════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ STATES      ║    ___  HSP  VSP  SYM  UND  HSH  HYP  PLS  DOT  DIG  ABC  _C_  _D_  _H_  _N_  _V_  _X_  _c_  _d_  _f_  _g_  _h_  _k_  _m_  _n_  _p_  _r_  _s_  _t_  _u_  _v_  _w_  _x_ ║
╚═════════════╩══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/];

const charnames = require("./tables/glyph-names.json");

/**
 * Base class for a Troff postprocessor.
 * @abstract
 * @class
 */
class Postprocessor {
	
	beginPage            (){ }
	handleDeviceControl  (){ }
	handleDrawingCommand (){ }
	handleUnknownCommand (){ }
	informEOL            (){ }
	informWordSpace      (){ }
	moveByX              (){ }
	moveByY              (){ }
	moveThenPrint        (){ }
	moveToX              (){ }
	moveToY              (){ }
	printChar            (){ }
	printText            (){ }
	readComment          (){ }
	setColour            (){ }
	setFont              (){ }
	setSize              (){ }
	
	
	process(data){
		const isString = "string" === typeof data;
		let tokenData = "";
		let tokenType = 0;
		let state = 0;
		
		const {length} = data;
		for(let i = 0; i < length; ++i){
			const [char, code] = isString
				? [data[i], data.charCodeAt(i)]
				: [String.fromCharCode(data[i]), data[i]];
			const cc = charmap[code];
			
			const nextState = STT[state][cc];
			if(nextState < 0){
				this.exec(tokenType, tokenData, i);
				tokenType =  nextState;
				state     = ~nextState;
				tokenData = (JP1 === state) ? char : "";
			}
			else{
				state = nextState;
				if(0 !== state)
					tokenData += char;
			}
		}
	}
	
	
	exec(cmd, data, offset){
		this.lastCommand = [cmd, data, offset];
		switch(cmd){
			
			// Niladic commands
			case WW0: this.informWordSpace();     break;
			
			// Monadic commands: String argument
			case TT0: this.printText(data);       break;
			case Cc0: this.printChar(data);       break;
			case CO0: this.readComment(data);     break;
			
			// Monadic commands: Numeric argument
			case PP0: this.beginPage(+data);      break;
			case Hh0: this.moveByX(+data);        break;
			case Vv0: this.moveByY(+data);        break;
			case HH0: this.moveToX(+data);        break;
			case VV0: this.moveToY(+data);        break;
			case FF0: this.setFont(+data);        break;
			case SS0: this.setSize(+data);        break;
			
			// Variadic commands: Whitespace-separated list of mixed-type values
			case DD0: // * Drawing command
			case XX0: // * Device controls
			case Nn0: // * Informing EOL, but ignored anyway
				data = data.trim().split(/\s+/);
				switch(cmd){
					case XX0: this.handleDeviceControl(...data);    break;
					case DD0: this.handleDrawingCommand(...data);   break;
					case Nn0: this.informEOL(...data.map(n => +n)); break;
				}
				break;
			
			
			case MM0:
				const units = data.substr(1).trim().split(/\s+/).map(n => +n);
				this.setColour(data[0], units);
				break;
			
			// Print character by index
			case NN0:
				this.printChar(String.fromCharCode(+data));
				break;
			
			// Print character by name
			case CC0:
				this.printChar(this.getCharByName(data));
				break;
			
			case JP0:
				const [cols, char] = data.replace(/\s+/g, "").split(/(?=.$)/);
				this.moveThenPrint(+cols, char);
				break;

			case UU0:
				const [, kerning, text] = data.match(/^(\d+)\s*(.*)$/m);
				this.printTrackedText(+kerning, text);
				break;
			
			default:
				this.handleUnknownCommand(cmd, data);
		}
	}
	
	
	getCharByName(input){
		
		// Named character
		if(charnames[input])
			return charnames[input];
		
		// Literal character
		if(1 === input.length)
			return input;
		
		// uXXXX: Unicode codepoint in hexadecimal (e.g., u09AF)
		if(/^u(?!0[A-F0-9]{4,})[A-F0-9]{4,}/.test(input)){
			const cp = parseInt(RegExp["$&"].substr(1), 16);
			// Invalid: Exceeds highest possible codepoint
			if(cp > 0x10FFFF)
				return "";
			// Invalid: Surrogate character
			if(cp >= 0xD800 && cp <= 0xDBFF || cp >= 0xDC00 && cp <= 0xDFFF)
				return "";
			return String.fromCharCode(cp);
		}
		
		// charXXX: ASCII character by decimal codepoint (e.g., char72)
		if(/^char[0-9]{1,3}$/.test(input)){
			const cp = parseInt(input.substr(4));
			return (cp <= 0xFF) ? String.fromCharCode(cp) : "";
		}
		
		console.warn(`Unrecognised glyph-name: ${input}`);
		return "";
	}
}

Postprocessor.tokenTypes = {
	BEGIN_PAGE:   PP0,
	CHAR_INDEXED: NN0,
	CHAR_LITERAL: Cc0,
	CHAR_NAMED:   CC0,
	COMMENT:      CO0,
	DEVICE_CTRL:  XX0,
	DRAWING:      DD0,
	INFORM_EOL:   Nn0,
	INFORM_PAD:   WW0,
	MOVE_ABS_H:   HH0,
	MOVE_ABS_V:   VV0,
	MOVE_PRINT:   JP0,
	MOVE_REL_H:   Hh0,
	MOVE_REL_V:   Vv0,
	SET_COLOUR:   MM0,
	SET_FONT:     FF0,
	SET_SIZE:     SS0,
	TEXT_NORMAL:  TT0,
	TEXT_TRACKED: UU0,
};

module.exports = Postprocessor;
