"use strict";
const fontStyles = {
	"AB":     ["ITC Avant Garde Gothic, URW Gothic L, URW Gothic, Gothic L, sans-serif", "600"],
	"ABI":    ["ITC Avant Garde Gothic, URW Gothic L, URW Gothic, Gothic L, sans-serif", "600", "oblique"],
	"AI":     ["ITC Avant Garde Gothic, URW Gothic L, URW Gothic, Gothic L, sans-serif", "oblique"],
	"AR":     ["ITC Avant Garde Gothic, URW Gothic L, URW Gothic, Gothic L, sans-serif"],
	"BMB":    ["ITC Bookman, URW Bookman L, URW Bookman, Bookman L, Bookman, serif", "600"],
	"BMBI":   ["ITC Bookman, URW Bookman L, URW Bookman, Bookman L, Bookman, serif", "600", "oblique"],
	"BMI":    ["ITC Bookman, URW Bookman L, URW Bookman, Bookman L, Bookman, serif", "oblique"],
	"BMR":    ["ITC Bookman, URW Bookman L, URW Bookman, Bookman L, Bookman, serif"],
	"CB":     ["Courier, Nimbus Mono PS, Nimbus Mono L, Nimbus Mono, monospace", "bold"],
	"CBI":    ["Courier, Nimbus Mono PS, Nimbus Mono L, Nimbus Mono, monospace", "bold", "italic"],
	"CI":     ["Courier, Nimbus Mono PS, Nimbus Mono L, Nimbus Mono, monospace", "italic"],
	"CR":     ["Courier, Nimbus Mono PS, Nimbus Mono L, Nimbus Mono, monospace"],
	"EURO":   ["FreeEuro, sans-serif"],
	"HB":     ["Helvetica, Helvetica Neue, Nimbus Sans, Nimbus Sans L, Arial, sans-serif", "bold"],
	"HBI":    ["Helvetica, Helvetica Neue, Nimbus Sans, Nimbus Sans L, Arial, sans-serif", "bold", "italic"],
	"HI":     ["Helvetica, Helvetica Neue, Nimbus Sans, Nimbus Sans L, Arial, sans-serif", "italic"],
	"HR":     ["Helvetica, Helvetica Neue, Nimbus Sans, Nimbus Sans L, Arial, sans-serif"],
	"HNB":    ["Helvetica Narrow, Nimbus Sans Narrow, Arial Narrow, sans-serif", "bold"],
	"HNBI":   ["Helvetica Narrow, Nimbus Sans Narrow, Arial Narrow, sans-serif", "bold", "italic"],
	"HNI":    ["Helvetica Narrow, Nimbus Sans Narrow, Arial Narrow, sans-serif", "italic"],
	"HNR":    ["Helvetica Narrow, Nimbus Sans Narrow, Arial Narrow, sans-serif"],
	"NB":     ["New Century Schoolbook, Century Schoolbook L, C059, Century Schoolbook, serif", "bold"],
	"NBI":    ["New Century Schoolbook, Century Schoolbook L, C059, Century Schoolbook, serif", "bold", "italic"],
	"NI":     ["New Century Schoolbook, Century Schoolbook L, C059, Century Schoolbook, serif", "italic"],
	"NR":     ["New Century Schoolbook, Century Schoolbook L, C059, Century Schoolbook, serif"],
	"PB":     ["Palatino, URW Palladio L, Palladio L, P052, Palatino Linotype, serif", "bold"],
	"PBI":    ["Palatino, URW Palladio L, Palladio L, P052, Palatino Linotype, serif", "bold", "italic"],
	"PI":     ["Palatino, URW Palladio L, Palladio L, P052, Palatino Linotype, serif", "italic"],
	"PR":     ["Palatino, URW Palladio L, Palladio L, P052, Palatino Linotype, serif"],
	"S":      ["Standard Symbols PS, Standard Symbols L, Symbol, serif"],
	"SS":     ["Standard Symbols PS, Standard Symbols L, Symbol, serif", "oblique"],
	"TB":     ["Times, Nimbus Roman No9 L, Nimbus Roman, serif", "bold"],
	"TBI":    ["Times, Nimbus Roman No9 L, Nimbus Roman, serif", "bold", "italic"],
	"TI":     ["Times, Nimbus Roman No9 L, Nimbus Roman, serif", "italic"],
	"TR":     ["Times, Nimbus Roman No9 L, Nimbus Roman, serif"],
	"ZCMI":   ["ITC Zapf Chancery, Zapf Chancery, Chancery L, URW Chancery L, Z003, cursive", "italic"],
	"ZD":     ["ITC Zapf Dingbats, Zapf Dingbats, D050000L, Dingbats"],
	"U-AB":   ["URW Gothic L, URW Gothic, Gothic L, sans-serif", "600"],
	"U-ABI":  ["URW Gothic L, URW Gothic, Gothic L, sans-serif", "600", "oblique"],
	"U-AI":   ["URW Gothic L, URW Gothic, Gothic L, sans-serif", "oblique"],
	"U-AR":   ["URW Gothic L, URW Gothic, Gothic L, sans-serif"],
	"U-BMB":  ["URW Bookman L, URW Bookman, Bookman L, Bookman, serif", "600"],
	"U-BMBI": ["URW Bookman L, URW Bookman, Bookman L, Bookman, serif", "600", "italic"],
	"U-BMI":  ["URW Bookman L, URW Bookman, Bookman L, Bookman, serif", "italic"],
	"U-BMR":  ["URW Bookman L, URW Bookman, Bookman L, Bookman, serif"],
	"U-CB":   ["Nimbus Mono PS, Nimbus Mono L, Nimbus Mono, monospace", "bold"],
	"U-CBI":  ["Nimbus Mono PS, Nimbus Mono L, Nimbus Mono, monospace", "bold", "oblique"],
	"U-CI":   ["Nimbus Mono PS, Nimbus Mono L, Nimbus Mono, monospace", "oblique"],
	"U-CR":   ["Nimbus Mono PS, Nimbus Mono L, Nimbus Mono, monospace"],
	"U-HB":   ["Nimbus Sans, Nimbus Sans L, Arial, sans-serif", "bold"],
	"U-HBI":  ["Nimbus Sans, Nimbus Sans L, Arial, sans-serif", "bold", "italic"],
	"U-HI":   ["Nimbus Sans, Nimbus Sans L, Arial, sans-serif", "italic"],
	"U-HR":   ["Nimbus Sans, Nimbus Sans L, Arial, sans-serif"],
	"U-HNB":  ["Nimbus Sans Narrow, Arial Narrow, sans-serif", "bold"],
	"U-HNBI": ["Nimbus Sans Narrow, Arial Narrow, sans-serif", "bold", "oblique"],
	"U-HNI":  ["Nimbus Sans Narrow, Arial Narrow, sans-serif", "oblique"],
	"U-HNR":  ["Nimbus Sans Narrow, Arial Narrow, sans-serif"],
	"U-NB":   ["Century Schoolbook L, C059, Century Schoolbook, serif", "bold"],
	"U-NBI":  ["Century Schoolbook L, C059, Century Schoolbook, serif", "bold", "italic"],
	"U-NI":   ["Century Schoolbook L, C059, Century Schoolbook, serif", "italic"],
	"U-NR":   ["Century Schoolbook L, C059, Century Schoolbook, serif"],
	"U-PB":   ["URW Palladio L, Palladio L, P052, Palatino Linotype, serif", "bold"],
	"U-PBI":  ["URW Palladio L, Palladio L, P052, Palatino Linotype, serif", "bold", "italic"],
	"U-PI":   ["URW Palladio L, Palladio L, P052, Palatino Linotype, serif", "italic"],
	"U-PR":   ["URW Palladio L, Palladio L, P052, Palatino Linotype, serif"],
	"U-S":    ["Standard Symbols PS, Standard Symbols L, serif"],
	"U-TB":   ["Times, Nimbus Roman No9 L, Nimbus Roman, serif", "bold"],
	"U-TBI":  ["Times, Nimbus Roman No9 L, Nimbus Roman, serif", "bold", "italic"],
	"U-TI":   ["Times, Nimbus Roman No9 L, Nimbus Roman, serif", "italic"],
	"U-TR":   ["Times, Nimbus Roman No9 L, Nimbus Roman, serif"],
	"U-ZCMI": ["ITC Zapf Chancery, Zapf Chancery, Chancery L, URW Chancery L, Z003, cursive", "italic"],
	"U-ZD":   ["D050000L, Dingbats"]
};
const glyphNames = {
	"space": " ",
	"dq":  "\"",
	"sh":  "#",
	"Do":  "$",
	"aq":  "'",
	"pl":  "+",
	"sl":  "/",
	"eq":  "=",
	"at":  "@",
	"lB":  "[",
	"rs":  "\\",
	"rB":  "]",
	"a^":  "^",
	"ha":  "^",
	"ru":  "_",
	"ul":  "_",
	"ga":  "`",
	"ff":  "ff",
	"Fi":  "ffi",
	"Fl":  "ffl",
	"fi":  "fi",
	"fl":  "fl",
	"lC":  "{",
	"ba":  "|",
	"or":  "|",
	"rC":  "}",
	"a~":  "~",
	"ti":  "~",
	"r!":  "¡",
	"ct":  "¢",
	"Po":  "£",
	"Cs":  "¤",
	"Ye":  "¥",
	"bb":  "¦",
	"sc":  "§",
	"ad":  "¨",
	"co":  "©",
	"Of":  "ª",
	"Fo":  "«",
	"no":  "¬",
	"tno": "¬",
	"rg":  "®",
	"a-":  "¯",
	"de":  "°",
	"+-":  "±",
	"t+-": "±",
	"S2":  "²",
	"S3":  "³",
	"aa":  "´",
	"mc":  "µ",
	"ps":  "¶",
	"pc":  "·",
	"ac":  "¸",
	"S1":  "¹",
	"Om":  "º",
	"Fc":  "»",
	"14":  "¼",
	"12":  "½",
	"34":  "¾",
	"r?":  "¿",
	"`A":  "À",
	"'A":  "Á",
	"^A":  "Â",
	"~A":  "Ã",
	":A":  "Ä",
	"oA":  "Å",
	"AE":  "Æ",
	",C":  "Ç",
	"`E":  "È",
	"'E":  "É",
	"^E":  "Ê",
	":E":  "Ë",
	"`I":  "Ì",
	"'I":  "Í",
	"^I":  "Î",
	":I":  "Ï",
	"-D":  "Ð",
	"~N":  "Ñ",
	"`O":  "Ò",
	"'O":  "Ó",
	"^O":  "Ô",
	"~O":  "Õ",
	":O":  "Ö",
	"mu":  "×",
	"tmu": "×",
	"/O":  "Ø",
	"`U":  "Ù",
	"'U":  "Ú",
	"^U":  "Û",
	":U":  "Ü",
	"'Y":  "Ý",
	"TP":  "Þ",
	"ss":  "ß",
	"`a":  "à",
	"'a":  "á",
	"^a":  "â",
	"~a":  "ã",
	":a":  "ä",
	"oa":  "å",
	"ae":  "æ",
	",c":  "ç",
	"`e":  "è",
	"'e":  "é",
	"^e":  "ê",
	":e":  "ë",
	"`i":  "ì",
	"'i":  "í",
	"^i":  "î",
	":i":  "ï",
	"Sd":  "ð",
	"~n":  "ñ",
	"`o":  "ò",
	"'o":  "ó",
	"^o":  "ô",
	"~o":  "õ",
	":o":  "ö",
	"di":  "÷",
	"tdi": "÷",
	"/o":  "ø",
	"`u":  "ù",
	"'u":  "ú",
	"^u":  "û",
	":u":  "ü",
	"'y":  "ý",
	"Tp":  "þ",
	":y":  "ÿ",
	"'C":  "Ć",
	"'c":  "ć",
	".i":  "ı",
	"IJ":  "Ĳ",
	"ij":  "ĳ",
	"/L":  "Ł",
	"/l":  "ł",
	"OE":  "Œ",
	"oe":  "œ",
	"vS":  "Š",
	"vs":  "š",
	":Y":  "Ÿ",
	"vZ":  "Ž",
	"vz":  "ž",
	"Fn":  "ƒ",
	".j":  "ȷ",
	"ah":  "ˇ",
	"ab":  "˘",
	"a.":  "˙",
	"ao":  "˚",
	"ho":  "˛",
	"a\"": "˝",
	"*A":  "Α",
	"*B":  "Β",
	"*G":  "Γ",
	"*D":  "Δ",
	"*E":  "Ε",
	"*Z":  "Ζ",
	"*Y":  "Η",
	"*H":  "Θ",
	"*I":  "Ι",
	"*K":  "Κ",
	"*L":  "Λ",
	"*M":  "Μ",
	"*N":  "Ν",
	"*C":  "Ξ",
	"*O":  "Ο",
	"*P":  "Π",
	"*R":  "Ρ",
	"*S":  "Σ",
	"*T":  "Τ",
	"*U":  "Υ",
	"*F":  "Φ",
	"*X":  "Χ",
	"*Q":  "Ψ",
	"*W":  "Ω",
	"*a":  "α",
	"*b":  "β",
	"*g":  "γ",
	"*d":  "δ",
	"*e":  "ε",
	"*z":  "ζ",
	"*y":  "η",
	"*h":  "θ",
	"*i":  "ι",
	"*k":  "κ",
	"*l":  "λ",
	"*m":  "μ",
	"*n":  "ν",
	"*c":  "ξ",
	"*o":  "ο",
	"*p":  "π",
	"*r":  "ρ",
	"ts":  "ς",
	"*s":  "σ",
	"*t":  "τ",
	"*u":  "υ",
	"+f":  "φ",
	"*x":  "χ",
	"*q":  "ψ",
	"*w":  "ω",
	"+h":  "ϑ",
	"*f":  "ϕ",
	"+p":  "ϖ",
	"+e":  "ϵ",
	"-":   "‐",
	"hy":  "‐",
	"en":  "–",
	"em":  "—",
	"`":   "‘",
	"oq":  "‘",
	"'":   "’",
	"cq":  "’",
	"bq":  "‚",
	"lq":  "“",
	"rq":  "”",
	"Bq":  "„",
	"dg":  "†",
	"dd":  "‡",
	"bu":  "•",
	"%0":  "‰",
	"fm":  "′",
	"sd":  "″",
	"fo":  "‹",
	"fc":  "›",
	"rn":  "‾",
	"f/":  "⁄",
	"eu":  "€",
	"Eu":  "€",
	"-h":  "ℏ",
	"hbar": "ℏ",
	"Im":  "ℑ",
	"wp":  "℘",
	"Re":  "ℜ",
	"tm":  "™",
	"Ah":  "ℵ",
	"18":  "⅛",
	"38":  "⅜",
	"58":  "⅝",
	"78":  "⅞",
	"<-":  "←",
	"ua":  "↑",
	"arrowverttp": "↑",
	"->":  "→",
	"da":  "↓",
	"arrowvertbt": "↓",
	"arrowvertex": "\u23D0",
	"<>":  "↔",
	"va":  "↕",
	"CR":  "↵",
	"lA":  "⇐",
	"uA":  "⇑",
	"rA":  "⇒",
	"dA":  "⇓",
	"hA":  "⇔",
	"vA":  "⇕",
	"fa":  "∀",
	"pd":  "∂",
	"te":  "∃",
	"es":  "∅",
	"gr":  "∇",
	"mo":  "∈",
	"nm":  "∉",
	"st":  "∋",
	"product": "∏",
	"coproduct": "∐",
	"sum":  "∑",
	"\\-":  "−",
	"mi":   "−",
	"-+":   "∓",
	"**":   "∗",
	"sqrt": "√",
	"sr":   "√",
	"pt":   "∝",
	"if":   "∞",
	"/_":   "∠",
	"AN":   "∧",
	"OR":   "∨",
	"ca":   "∩",
	"cu":   "∪",
	"is":   "∫",
	"integral": "∫",
	"tf":   "∴",
	"3d":   "∴",
	"ap":   "∼",
	"|=":   "≃",
	"=~":   "≅",
	"~~":   "≈",
	"~=":   "≈",
	"!=":   "≠",
	"==":   "≡",
	"ne":   "≢",
	"<=":   "≤",
	">=":   "≥",
	"<<":   "≪",
	">>":   "≫",
	"sb":   "⊂",
	"sp":   "⊃",
	"nb":   "⊄",
	"nc":   "⊅",
	"ib":   "⊆",
	"ip":   "⊇",
	"c+":   "⊕",
	"c*":   "⊗",
	"pp":   "⊥",
	"md":   "⋅",
	"lc":   "⌈",
	"rc":   "⌉",
	"lf":   "⌊",
	"rf":   "⌋",
	"parenlefttp":    "⎛",
	"parenleftex":    "⎜",
	"parenleftbt":    "⎝",
	"parenrighttp":   "⎞",
	"parenrightex":   "⎟",
	"parenrightbt":   "⎠",
	"bracketlefttp":  "⎡",
	"bracketleftex":  "⎢",
	"bracketleftbt":  "⎣",
	"bracketrighttp": "⎤",
	"bracketrightex": "⎥",
	"bracketrightbt": "⎦",
	"lt":             "⎧",
	"bracelefttp":    "⎧",
	"lk":             "⎨",
	"braceleftmid":   "⎨",
	"lb":             "⎩",
	"braceleftbt":    "⎩",
	"bv":             "⎪",
	"barex":          "⎪",
	"braceex":        "⎪",
	"braceleftex":    "⎪",
	"bracerightex":   "⎪",
	"rt":             "⎫",
	"bracerighttp":   "⎫",
	"rk":             "⎬",
	"bracerightmid":  "⎬",
	"rb":             "⎭",
	"bracerightbt":   "⎭",
	"an":             "⎯",
	"br":             "│",
	"sq":             "□",
	"lz":             "◊",
	"ci":             "○",
	"lh":             "☜",
	"rh":             "☞",
	"SP":             "♠",
	"CL":             "♣",
	"HE":             "♥",
	"DI":             "♦",
	"OK":             "✓",
	"la":             "⟨",
	"ra":             "⟩",
	"radicalex":      "\uF8E5",
	"registerserif":  "\uF8E8",
	"copyrightserif": "\uF8E9",
	"trademarkserif": "\uF8EA",
	"apple":          "\uF8FF"
};
const symbolMaps = {
	"S SS": {
		"∀": 34,
		"∃": 36,
		"∋": 39,
		"∗": 42,
		"−": 45,
		"≅": 64,
		"Α": 65,
		"Β": 66,
		"Χ": 67,
		"Δ": 68,
		"Ε": 69,
		"Φ": 70,
		"Γ": 71,
		"Η": 72,
		"Ι": 73,
		"ϑ": 74,
		"Κ": 75,
		"Λ": 76,
		"Μ": 77,
		"Ν": 78,
		"Ο": 79,
		"Π": 80,
		"Θ": 81,
		"Ρ": 82,
		"Σ": 83,
		"Τ": 84,
		"Υ": 85,
		"ς": 86,
		"Ω": 87,
		"Ξ": 88,
		"Ψ": 89,
		"Ζ": 90,
		"∴": 92,
		"⊥": 94,
		"\uF8E5": 96,
		"α": 97,
		"β": 98,
		"χ": 99,
		"δ": 100,
		"ε": 101,
		"ϕ": 102,
		"γ": 103,
		"η": 104,
		"ι": 105,
		"φ": 106,
		"κ": 107,
		"λ": 108,
		"μ": 109,
		"ν": 110,
		"ο": 111,
		"π": 112,
		"θ": 113,
		"ρ": 114,
		"σ": 115,
		"τ": 116,
		"υ": 117,
		"ϖ": 118,
		"ω": 119,
		"ξ": 120,
		"ψ": 121,
		"ζ": 122,
		"∼": 126,
		"€": 160,
		"Υ": 161,
		"′": 162,
		"≤": 163,
		"⁄": 164,
		"∞": 165,
		"ƒ": 166,
		"♣": 167,
		"♦": 168,
		"♥": 169,
		"♠": 170,
		"↔": 171,
		"←": 172,
		"↑": 173,
		"→": 174,
		"↓": 175,
		"°": 176,
		"±": 177,
		"″": 178,
		"≥": 179,
		"×": 180,
		"∝": 181,
		"∂": 182,
		"·": 183,
		"÷": 184,
		"≠": 185,
		"≡": 186,
		"≈": 187,
		"…": 188,
		"\u23D0": 189,
		"⎯": 190,
		"↵": 191,
		"ℵ": 192,
		"ℑ": 193,
		"ℜ": 194,
		"℘": 195,
		"⊗": 196,
		"⊕": 197,
		"∅": 198,
		"∩": 199,
		"∪": 200,
		"⊃": 201,
		"⊇": 202,
		"⊄": 203,
		"⊂": 204,
		"⊆": 205,
		"∈": 206,
		"∉": 207,
		"/_": 208,
		"∇": 209,
		"\uF8E8": 210,
		"\uF8E9": 211,
		"\uF8EA": 212,
		"∏": 213,
		"√": 214,
		"⋅": 215,
		"¬": 216,
		"∧": 217,
		"∨": 218,
		"⇔": 219,
		"⇐": 220,
		"⇑": 221,
		"⇒": 222,
		"⇓": 223,
		"◊": 224,
		"⟨": 225,
		"®": 226,
		"©": 227,
		"™": 228,
		"∑": 229,
		"⎛": 230,
		"⎜": 231,
		"⎝": 232,
		"⎡": 233,
		"⎢": 234,
		"⎣": 235,
		"⎧": 236,
		"⎨": 237,
		"⎩": 238,
		"⎪": 239,
		"⟩": 241,
		"∫": 242,
		"⌠": 243,
		"⎮": 244,
		"⌡": 245,
		"⎞": 246,
		"⎟": 247,
		"⎠": 248,
		"⎤": 249,
		"⎥": 250,
		"⎦": 251,
		"⎫": 252,
		"⎬": 253,
		"⎭": 254,
		"\uF8FF": 256
	}
};

const Postprocessor = (function(){
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
					const [_, kerning, text] = data.match(/^(\d+)\s*(.*)$/m);
					this.printTrackedText(+kerning, text);
					break;
				
				default:
					this.handleUnknownCommand(cmd, data);
			}
		}
		
		
		getCharByName(input){
			
			// Named character
			if(glyphNames[input])
				return glyphNames[input];
			
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

	return Postprocessor;
}());

const CanvasRenderer = (function(){
	const {tokenTypes}  = Postprocessor;


	class CanvasRenderer extends Postprocessor{
		
		constructor(){
			super();
			this.resetDrawingState();
			this.resetOutputProperties();
			this.resetFontStyles();
		}
		
		
		resetDrawingState(){
			this.devCmds       = [];
			this.charHeight    = 0;
			this.charSize      = 0;
			this.colour        = "#000";
			this.drawColour    = "#000";
			this.font          = ["", "px sans-serif"];
			this.invisible     = false;
			this.lineWidth     = 1;
			this.hotspot       = null;
			this.hotspots      = [];
			this.hotspotHold   = false;
			this.hotspotWrap   = false;
			this.reversed      = false;
			this.rotated       = false;
			this.slant         = 0;
			this.sourceFile    = "";
			this.tm            = null;
			this.x             = 0;
			this.y             = 0;
			
			if(this.context){
				this.context.lineCap  = "round";
				this.context.lineJoin = "round";
				this.context.moveTo(this.x, this.y);
			}
		}
		
		
		resetFontStyles(){
			this.fixKerning = true;
			this.fixQuotes  = true;
			this.fontStyles = Object.assign({}, fontStyles);
			this.fonts      = [0, 0, 0, 0, 0, 0, "S", "ZD"];
			this.fonts.forEach((font, index) => {
				font && this.mountFont(index, font);
			});
		}
		
		
		resetOutputProperties(){
			this.autoScale  = true;
			this.sizeScale  = 1000;
			this.scale      = 1;
			this.res        = [72000, 1, 1];
			this.pageWidth  = 612;
			this.pageHeight = 792;
			this.unitWidth  = 1000;
			
			// Setup default symbol-maps
			this.charMaps   = {};
			for(const keyedFonts in symbolMaps)
				keyedFonts.split(" ").forEach(fontName =>
					this.charMaps[fontName] = symbolMaps[keyedFonts]);
		}
		
		
		process(source){
			this.page       = [];
			this.pages      = [this.page];
			this.buffer     = null;
			this.anchors    = new Map();
			this.bookmarks  = [];
			this.resetDrawingState();
			super.process(source);
			if(null !== this.buffer){
				this.page.push(...this.buffer);
				this.buffer = null;
			}
			this.minPageWidth = this.minPageHeight = Number.MAX_VALUE;
			this.maxPageWidth = this.maxPageHeight = Number.MIN_VALUE;
			this.pages.forEach((page, index) => {
				page.index = index;
				if(!page.width)  page.width  = this.pageWidth;
				if(!page.height) page.height = this.pageHeight;
				if(page.width  > this.maxPageWidth)  this.maxPageWidth  = page.width;
				if(page.width  < this.minPageWidth)  this.minPageWidth  = page.width;
				if(page.height > this.maxPageHeight) this.maxPageHeight = page.height;
				if(page.height < this.minPageHeight) this.minPageHeight = page.height;
			});
			this.bookmarks = this.resolveOutline(this.bookmarks);
		}
		
		
		exec(cmd, data, offset){
			if(!cmd) return;
			const isSquashableCmd = cmd === tokenTypes.TEXT_NORMAL || cmd === tokenTypes.MOVE_ABS_H;
			if(null !== this.buffer && !isSquashableCmd){
				if(cmd === tokenTypes.INFORM_EOL)
					this.page.push(...this.buffer);
				else{
					const squashedText = this.buffer.map(cmd => {
						return (cmd[0] === tokenTypes.TEXT_NORMAL) ? cmd[1] : "";
					}).join("");
					this.page.push([tokenTypes.TEXT_NORMAL, squashedText]);
				}
				this.buffer = null;
			}
			switch(cmd){
				case tokenTypes.BEGIN_PAGE:
					this.page = [...this.pages[0]];
					this.page.width  = this.pageWidth;
					this.page.height = this.pageHeight;
					!this.pages[data]
						? this.pages[data] = this.page
						: this.pages.splice(data, 0, this.page);
					return;
				case tokenTypes.DEVICE_CTRL:
					// Changes to paper-size persist between pages, so we check it upfront
					if(/^\s*X\S*\s+papersize=(\d+(?:\.\d+)?[icpPm]),(\d+(?:\.\d+)?[icpPm])/.test(data)){
						this.pageWidth  = this.parseLength(RegExp.$1);
						this.pageHeight = this.parseLength(RegExp.$2);
						if(this.page){
							this.page.width  = this.pageWidth;
							this.page.height = this.pageHeight;
						}
						return;
					}
					data = data.trim()
						.replace(/^X\S*\s+ps:exec\b/, "X ps: exec")
						.replace(/\n\+/g, "\n");
					
					// Named destinations and bookmarks must be known in advance too
					if(/\[\s*(\S.+)\s+pdfmark\b/.test(data)){
						data = RegExp.lastParen
							.replace(/(\d{4,6}) u/g,   (_,n) => n / this.sizeScale)
							.replace(/\\\[u00(..)\]/g, (_,n) => parseInt(n, 16));
						if(/^\/Dest\s+\/?(\S+)(.*)\s+\/DEST$/.test(data)){
							const name = RegExp.$1;
							const view = RegExp.$2.match(/\/View\s+\[\/FitH\s+(-?[\d.]+)\s*\]/) || [0];
							this.anchors.set(name, {page: this.page, offset: +view.pop()});
							return;
						}
						if(/^\/Dest\s+\/?(\S+)\s+\/Title\s+\((.+)\)\s+\/Level\s+(-?\d+)\s+\/OUT$/.test(data)){
							const level = Math.abs(RegExp.$3) || 1;
							this.bookmarks.push({target: RegExp.$1, title: RegExp.$2, level});
							return;
						}
					}
					break;
				case tokenTypes.TEXT_NORMAL:
					if(this.fixKerning){
						this.buffer = this.buffer || [];
						this.buffer.push([cmd, data]);
						return;
					}
					break;
				case tokenTypes.MOVE_ABS_H:
					if(this.fixKerning && null !== this.buffer){
						this.buffer.push([cmd, data]);
						return;
					}
			}
			this.page.push([cmd, data]);
		}
		
		
		resizeCanvas(){
			if(!this.autoScale) return;
			const {width, height} = this.page;
			const {canvas}     = this.context;
			const pixelDensity = window.devicePixelRatio;
			const renderThresh = Math.max(screen.availWidth, screen.availHeight) * pixelDensity;
			const aspectRatio  = height / width;
			
			// Portrait
			if(width < height){
				this.scale    = width * this.unitWidth / renderThresh;
				canvas.width  = renderThresh;
				canvas.height = renderThresh * aspectRatio;
			}
			
			// Landscape
			else{
				this.scale    = height * this.unitWidth / renderThresh;
				canvas.width  = renderThresh * (width / height);
				canvas.height = renderThresh;
			}
		}
		
		
		resolveOutline(nodes){
			const output = [];
			let prev, currentLevel = 1;
			
			for(let node of nodes){
				node.children = [];
				node.parent   = null;
				let {level}   = node;
				
				// Increase depth
				if(level > currentLevel){
					node.parent = prev;
					prev.children.push(node);
					currentLevel = level;
				}
				// Decrease depth
				else if(level < currentLevel)
					while(prev){
						if(prev.level <= level){
							currentLevel = prev.level;
							prev.parent
								? prev.parent.children.push(node)
								: output.push(node);
							node.parent = prev.parent;
							break;
						}
						prev = prev.parent;
					}
				// Same depth
				else{
					if(level > 1){
						prev = prev.parent || prev;
						prev.children.push(node)
						node.parent = prev;
					}
					else output.push(node)
				}
				prev = node;
			}
			
			return output;
		}
		
		
		render(page, context = null, clear = true){
			if(null !== context)
				this.context = context;
			if(clear)
				this.clearPage();
			
			this.resetDrawingState();
			this.page = page;
			this.resizeCanvas();
			
			for(const [type, data] of this.page){
				if(type === tokenTypes.DEVICE_CTRL)
					super.exec(type, data);
				else if(this.invisible)
					continue;
				else super.exec(type, data);
			}
		}
		
		
		clearPage(){
			const {canvas} = this.context;
			this.context.clearRect(0, 0, canvas.width, canvas.height);
		}
		
		
		drawArc(args){
			const h0 = this.x * this.scale;
			const v0 = this.y * this.scale;
			const h1 = +args[0];
			const v1 = +args[1];
			const h2 = +args[2];
			const v2 = +args[3];
			
			const endX = h1 + h2;
			const endY = v1 + v2;
			const N    = endX * endX + endY * endY;
			
			if(0 !== N){
				let K            = .5 - (h1 * endX + v1 * endY) / N;
				let centreX      = h1 + (K * endX);
				let centreY      = v1 + (K * endY);
				const radius     = Math.sqrt(centreX * centreX + centreY * centreY) / this.scale;
				const startAngle = Math.atan2(-centreY, -centreX);
				const endAngle   = Math.atan2(v1 + v2 - centreY, h1 + h2 - centreX);
				centreX          = (h0 + centreX) / this.scale;
				centreY          = (v0 + centreY) / this.scale;
				this.context.beginPath();
				this.context.arc(centreX, centreY, radius, startAngle, endAngle, true);
				this.context.stroke();
			}

			else{
				this.context.beginPath();
				this.context.moveTo(h0 / this.scale, v0 / this.scale);
				this.context.lineTo((endX + h0) / this.scale, (endY + v0) / this.scale);
				this.context.stroke();
			}
			
			this.x += (h1 + h2) / this.scale;
			this.y += (v1 + v2) / this.scale;
		}
		
		
		drawCircle(diameter, filled = false){
			const radius = (diameter / this.scale) / 2;
			this.context.beginPath();
			this.context.ellipse(this.x + radius, this.y, radius, radius, 0, 0, 2 * Math.PI);
			this.x += radius * 2;
			filled
				? this.fill()
				: this.context.stroke();
		}
		
		
		drawEllipse(args, filled = false){
			const radiusX = (args[0] / this.scale) / 2;
			const radiusY = (args[1] / this.scale) / 2;
			this.context.beginPath();
			this.context.ellipse(this.x + radiusX, this.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
			this.x += radiusX * 2;
			filled
				? this.fill()
				: this.context.stroke();
		}
		
		
		drawLine(args){
			this.context.moveTo(this.x, this.y);
			this.x += +args[0] / this.scale;
			this.y += +args[1] / this.scale;
			this.context.lineTo(this.x, this.y);
			this.context.stroke();
		}
		
		
		drawPolygon(args, filled = false){
			this.context.beginPath();
			this.context.moveTo(this.x, this.y);
			let tmpX = this.x;
			let tmpY = this.y;
			let endX = 0;
			let endY = 0;
			const {length} = args;
			for(let i = 0; i < length; i += 2){
				const lineX = args[i]   / this.scale;
				const lineY = args[i+1] / this.scale;
				endX += lineX;
				endY += lineY;
				tmpX = tmpX + lineX;
				tmpY = tmpY + lineY;
				this.context.lineTo(tmpX, tmpY);
			}
			this.x += endX;
			this.y += endY;
			this.context.closePath();
			filled
				? this.fill()
				: this.context.stroke();
		}
		
		
		drawSpline(args){
			this.context.beginPath();
			this.context.moveTo(this.x, this.y);
			this.context.lineTo(
				this.x += (args[0] / 2) / this.scale,
				this.y += (args[1] / 2) / this.scale
			);
			const tNum = 2;
			const tDen = 3;
			const numPoints = args.length - 2;
			for(let i = 0; i < numPoints; i += 2){
				const nX = ((args[i]   - args[i]   / 2) + args[i+2] / 2) / this.scale;
				const nY = ((args[i+1] - args[i+1] / 2) + args[i+3] / 2) / this.scale;
				this.context.bezierCurveTo(
					this.x + ((args[i]   * tNum) / (2 * tDen)) / this.scale,
					this.y + ((args[i+1] * tNum) / (2 * tDen)) / this.scale,
					this.x + (args[i]   / 2 + (args[i+2] * (tDen - tNum)) / (2 * tDen)) / this.scale,
					this.y + (args[i+1] / 2 + (args[i+3] * (tDen - tNum)) / (2 * tDen)) / this.scale,
					this.x + nX,
					this.y + nY
				);
				this.x += nX;
				this.y += nY;
			}
			this.x += (args[numPoints]     - args[numPoints]     / 2) / this.scale;
			this.y += (args[numPoints + 1] - args[numPoints + 1] / 2) / this.scale;
			this.context.lineTo(this.x, this.y);
			this.context.stroke();
		}
		
		
		fill(){
			this.context.fillStyle = this.drawColour;
			this.context.fill();
			this.context.fillStyle = this.colour;
		}
		
		
		handleDeviceControl(ctrl, ...args){
			switch(ctrl[0]){
				// Source filename
				case "F":
					this.sourceFile = args.join(" ");
					break;
				
				// Mount font
				case "f":
					this.mountFont(...args);
					break;
				
				// Character height
				case "H":
					this.charHeight = +args[0] / this.scale;
					if(this.charSize === this.charHeight)
						this.charHeight = 0;
					this.updateTransformMatrix();
					break;
				
				// Output resolution
				case "r":
					this.res[0] = +args[0] || 0;
					this.res[1] = +args[1] || 0;
					this.res[2] = +args[2] || 0;
					break;
				
				// Slant
				case "S":
					this.slant = +args[0] || 0;
					this.updateTransformMatrix();
					break;
				
				// Device-specific
				case "X":
					this.handleExtendedDeviceControl(...args);
					break;
			}
		}
		
		
		handleDrawingCommand(type, ...args){
			switch(type[0]){
				case "~": this.drawSpline(args);          break;
				case "a": this.drawArc(args);             break;
				case "c": this.drawCircle(args[0]);       break;
				case "C": this.drawCircle(args[0], true); break;
				case "e": this.drawEllipse(args);         break;
				case "E": this.drawEllipse(args, true);   break;
				case "l": this.drawLine(args);            break;
				case "p": this.drawPolygon(args);         break;
				case "P": this.drawPolygon(args, true);   break;
				case "t": this.setLineThickness(args[0]); break;
				
				// Drawing colour
				case "F":
					if(type.length > 1)
						args.unshift(type.substr(1));
					const [mode, ...values] = args;
					this.drawColour = this.parseColour(mode, values);
					break;
				
				// Drawing colour (legacy)
				case "f":
					this.drawColour = (args[0] < 0 || args[0] > 1000)
						? this.context.fillStyle
						: this.parseColour("G", args);
					break;
			}
		}
		
		
		handleExtendedDeviceControl(name, ...args){
			let unknownCommand = false;
			switch(name){
				// PostScript commands
				case "ps:":
					switch(args[0]){
						
						// Output suppression
						case "invis":     this.invisible = true;  break;
						case "endinvis":  this.invisible = false; break;
						
						// Execute PostScript code
						case "exec":
							const code = args.join(" ");
							
							// Set rotation
							if(/exec gsave currentpoint 2 copy translate .+ rotate neg exch neg exch translate/.test(code))
								this.setRotation(args[6]);
							
							// Unset rotation
							else if("grestore" === args[1])
								this.setRotation(0);
							
							// Set stroke properties
							else if(/exec \d setline(cap|join)/.test(code))
								"cap" === RegExp.lastParen
									? (this.context.lineCap  = ["butt", "round", "square"][args[1]])
									: (this.context.lineJoin = ["miter", "round", "bevel"][args[1]]);
							
							// Unknown/non-graphical command
							else unknownCommand = true;
							break;
						default:
							unknownCommand = true;
					}
					break;
				
				// gropdf-specific
				case "pdf:":
					switch(args[0]){
						
						// "Hotspot" regions
						case "markstart":   this.hotspotStart(args);  break;
						case "markend":     this.hotspotEnd();        break;
						case "marksuspend": this.hotspotHold = true;  break;
						case "markrestart": this.hotspotHold = false; break;
						
						// Reverse letters
						case "xrev":
							this.reversed = !this.reversed;
							this.updateTransformMatrix();
							break;
						
						default:
							unknownCommand = true;
					}
					break;
				
				// Unrecognised
				default:
					unknownCommand = true;
			}
			
			if(unknownCommand)
				this.devCmds.push({x: this.x, y: this.y, name, args});
		}
		
		
		informEOL(){
			if(null !== this.hotspot){
				this.hotspotEnd();
				this.hotspotWrap = true;
			}
		}
		
		
		hotspotStart(args){
			this.hotspot = this.parseHotspot(args);
		}
		
		
		hotspotEnd(){
			if(null !== this.hotspot && !this.hotspotHold){
				this.hotspot.width = (this.x - this.hotspot.x) + this.hotspot.lead;
				this.hotspots.push(this.hotspot);
				this.hotspot = null;
			}
		}
		
		
		mountFont(position, name){
			const fontData = this.fontStyles[name];
			
			// No matching style strings for this font
			if(!fontData){
				console.warn(`Unrecognised font "${name}" will be rendered as sans-serif`);
				return ["", "px sans-serif"];
			}
			
			const family = fontData[0];
			const style  = fontData.slice(1).reverse().join(" ");
			this.fonts[position] = [style ? style + " " : "", `px ${family}`];
			this.fonts[position].name = name;
		}
		
		
		moveByX(value){
			this.x += +value / this.scale;
		}
		
		
		moveByY(value){
			this.y += +value / this.scale;
		}
		
		
		moveToX(value){
			this.x = +value / this.scale;
		}
		
		
		moveToY(value){
			this.y = +value / this.scale;
		}
		
		
		moveThenPrint(offset, text){
			this.x += Math.floor(+offset / this.res[1]) / this.scale;
			this.print(text);
		}
		
		
		parseColour(scheme, data){
			switch(scheme[0]){
				// CMY
				case "c":
					data = data.map(a => (1 - Math.round(a / 65536)) * 255);
					return `rgb(${ data.join() })`;
				
				// CMYK
				case "k":
					const [c, m, y, k] = args.map(a => Math.round(a / 65536));
					data = [
						255 * (1 - c) * (1 - k),
						255 * (1 - m) * (1 - k),
						255 * (1 - y) * (1 - k),
					];
					return `rgb(${ data.join() })`;
				
				// RGB
				case "r":
					data = data.map(a => Math.round(a / 257));
					return `rgb(${ data.join() })`;

				// Greyscale
				case "G": // Legacy `Df` command
					data = [Math.round((1 - data[0] / 1000) * 65536)];
				case "g":
					data = new Array(3).fill(Math.round(data[0] / 257));
					return `rgb(${ data.join() })`;
				
				default: return "#000";
			}
		}
		
		
		parseHotspot(args){
			const rst     = (+args[1] + +args[3]) / this.scale;
			const rsb     = (+args[2] - +args[3]) / this.scale;
			const lead    =  +args[3] / this.scale;
			const x       =  this.x - lead;
			const y       =  this.y - rst;
			const height  = (this.y - rsb) - (this.y - rst);
			const hotspot = new Hotspot(x, y, 0, height, lead, args);
			hotspot.parseExtraArgs(args.slice(4).join(" "));
			return hotspot;
		}
		
		
		parseLength(input){
			const value = input.substr(0, input.length - 1);
			const unit  = input.substr(-1);
			switch(unit){
				case "i": return parseInt(value * 72);         // Inches
				case "c": return parseInt(value * 72 / 2.54);  // Centimetres
				case "m": return parseInt(value * 72 / 25.4);  // Millimetres
				case "p": return +value;                       // Points
				case "P": return value * 6;                    // Picas
				case "z": return value / this.unitWidth;       // Scaled units
				default:  return NaN;
			}
		}
		
		
		print(text){
			text = this.remapChars(text);
			this.context.save();
			if(null !== this.tm){
				if(this.reversed){
					text = text.split("").reverse().join("");
					const {width} = this.context.measureText(text);
					this.context.translate(width, 0);
				}
				this.context.translate(this.x, this.y);
				this.context.transform(...this.tm);
				this.context.translate(-this.x, -this.y);
			}
			this.context.fillText(text, this.x, this.y);
			this.context.restore();
			if(true === this.hotspotWrap && !this.hotspotHold){
				const lastHotspot = this.hotspots[this.hotspots.length - 1];
				lastHotspot && this.hotspotStart(lastHotspot.rawArgs);
				this.hotspotWrap = false;
			}
		}
		
		
		printChar(text){
			this.print(text);
		}
		
		
		printText(data){
			this.print(data);
			this.x += this.context.measureText(data).width;
		}
		
		
		printTrackedText(spacing, text){
			spacing /= this.scale;
			for(const glyph of text.split("")){
				const {width} = this.context.measureText(glyph);
				this.print(glyph);
				this.x += width + spacing;
			}
		}
		
		
		remapChars(data){
			const map = this.charMaps[this.font ? this.font.name : "R"];
			if(map){
				let output = "";
				const {length} = data;
				for(let i = 0; i < length; ++i){
					const from = data[i];
					const to = map[from];
					output += to ? String.fromCharCode(to) : data;
				}
				return output;
			}
			else return data && this.fixQuotes
				? data.replace(/`/g, "\u{2018}").replace(/'/g, "\u{2019}")
				: data;
		}
		
		
		setColour(scheme, data){
			this.colour = this.parseColour(scheme, data);
			this.context.fillStyle = this.colour;
			this.context.strokeStyle = this.colour;
		}
		
		
		setFont(name){
			this.font = this.fonts[name];
			this.context.font = this.font[0] + this.charSize + this.font[1];
		}
		
		
		setLineThickness(value){
			let width = value / this.scale;
			if(width < 0)
				width = ((this.res[0] / (72 * this.sizeScale)) * 40 * this.charSize) / 1000;
			this.context.lineWidth = width;
			this.x += width;
		}
		
		
		setRotation(value){
			value = +value || 0;
			if(!value && this.rotated){
				this.context.restore();
				this.rotated = false;
			}
			else{
				this.context.save();
				this.context.resetTransform();
				this.context.translate(this.x, this.y);
				this.context.rotate(value * Math.PI / 180);
				this.context.translate(-this.x, -this.y);
				this.rotated = true;
			}
		}
		
		
		setSize(size){
			this.charSize = +size / this.scale;
			this.context.font = this.font[0] + this.charSize + this.font[1];
			if(this.lineWidth < 1){
				const width = ((this.res[0] / (72 * this.sizeScale)) * 40 * this.charSize) / 1000;
				this.context.lineWidth = width;
				this.x += width;
			}
		}
		
		
		updateTransformMatrix(){
			if(!this.reversed && 0 === this.slant && 0 === this.charHeight)
				this.tm = null;
			else{
				this.tm = [1,0,0,1,0,0];
				const {charHeight, charSize, slant, tm} = this;
				if(0 !== charHeight)
					tm[3] = charHeight / charSize;
				if(0 !== slant){
					let angle = -slant;
					if(0 !== charHeight)
						angle *= charHeight / charSize;
					angle = angle * Math.PI / 180;
					tm[2] = Math.sin(angle) / Math.cos(angle);
				}
				if(this.reversed)
					tm[0] = -tm[0];
			}
		}
	}


	class Hotspot{
		
		constructor(x, y, width, height, lead = 0, rawArgs = null){
			this.x      = x;
			this.y      = y;
			this.width  = width;
			this.height = height;
			this.lead   = lead;
			this.border = {
				cornerRadiusH: 0,
				cornerRadiusV: 0,
				colour: [0, 0, 0],
				dashGaps: [],
				thickness: 0,
			};
			if(rawArgs)
				this.rawArgs = rawArgs;
		}
		
		
		draw(context){
			if(!this.border.thickness) return;
			context.save();
			context.lineCap = "butt";
			context.lineJoin = "miter";
			context.lineWidth = this.border.thickness;
			context.setLineDash(this.border.dashGaps);
			context.strokeStyle = "rgb(" + this.border.colour.join(", ") + ")";
			context.strokeRect(this.x, this.y, this.width, this.height);
			context.restore();
		}
		
		
		parseExtraArgs(args){
			args = args.replace(/\s*\/Border\s+\[([^\[\]]+)\s*(?:\[([^\]]+)\]\s*)?\]/, (_, values, dash) => {
				values = values.trim().split(/\s+/);
				this.border.cornerRadiusH = +values[0] || 0;
				this.border.cornerRadiusV = +values[1] || 0;
				this.border.thickness     = +values[2] || 0;
				if(dash){
					dash = dash.trim().split(/\s+/).map(n => +n);
					this.border.dashGaps = dash;
				}
				return "";
			})
			.replace(/\s*\/Color\s*\[([^\]]+)\]/, (_, values) => {
				values = values.trim().split(/\s+/).map(n => Math.round(+n * 0xFF) || 0);
				this.border.colour = values;
				return "";
			})
			.replace(/\/Subtype\s+\/Link\s+(.+)/, (_, data) => {
				if(/^\/Dest\s+\/(\S+)\s*$/.test(data))
					this.targetDest = RegExp.lastParen;
				else if(/^\s*\/Action\s+<<\s*\/Subtype\s+\/URI/.test(data))
					this.targetURI = data.match(/\/URI\s+\((\S*)\)\s+>>/)[1];
				return "";
			})
			.trim();
			
			// Store anything we didn't expect to find
			if(args) this.unparsedArgs = args;
		}
	}

	Hotspot.prototype.rawArgs = null;
	Hotspot.prototype.unparsedArgs = "";

	return CanvasRenderer;
}());

const TroffView = (function(){
	const K_HOTSPOTS = Symbol("TroffViewHotspots");
	const K_HOTSPOT  = Symbol("TroffViewHotspot");
	const K_CANVAS   = Symbol("TroffViewCanvas");
	const K_CONTEXT  = Symbol("TroffViewContext");
	const sparePages = new Set();
	const spareSpots = new Set();

	class TroffView{
		
		constructor(attr = {}){
			const parentEl = attr.parentElement || null;
			delete attr.parentElement; // Omit from instance properties
			
			Object.assign(this, attr);
			const {classNames} = this;
			this.root          = this.div(classNames.root);
			this.zoomLayer     = this.div(classNames.zoomLayer);
			this.pagesList     = this.div(classNames.pagesList);
			
			this.zoomLayer.appendChild(this.pagesList);
			this.root.appendChild(this.zoomLayer);
			parentEl && parentEl.appendChild(this.root);
			
			this.renderer = new CanvasRenderer();
			this.fontListener = () => this.refresh();
			document.fonts.addEventListener("loadingdone", this.fontListener);
		}
		
		
		div(attr = {}){
			const div = document.createElement("div");
			if("string" === typeof attr)
				attr = {className: attr};
			return Object.assign(div, attr || {});
		}
		
		
		load(source){
			this.renderer.process(source);
			this.numPages = this.renderer.pages.length - 1;
			this.refresh();
		}
		
		
		loadFile(path){
			return new Promise((resolve, reject) => {
				readFile(path, "utf8", (error, data) =>
					error ? reject(error) : resolve(data));
			})
			.then(source => this.load(source))
			.catch(error => {
				console.error(`[TroffView::loadFile] Error loading ${path}`);
				console.dir(error);
			});
		}
		
		
		refresh(){
			const {numPages} = this;
			for(let i = 0; i < numPages; ++i){
				const page = this.renderer.pages[i + 1];
				if(!page) return;
				
				const node = this.pagesList.children[i];
				const context = node[K_CONTEXT];
				this.renderer.render(page, context);
				const width = Math.round(page.width / this.renderer.maxPageWidth * 100);
				node.style.width = `${width / this.spreadSize}%`;
				this.setHotspots(this.renderer.hotspots, node);
			}
		}
		
		
		/* Section: Page handling */
		
		get pages(){
			return this.pagesList
				? Array.from(this.pagesList.children)
				: [];
		}
		
		get numPages(){
			return this.pagesList
				? this.pagesList.childElementCount
				: 0;
		}
		set numPages(to){
			const pages = this.pagesList.children;
			const from = pages.length;
			to = Math.max(1, +to || 1);
			
			if(to > from)
				for(let i = from; i < to; ++i)
					this.pagesList.appendChild(this.addPage());
			
			else if(to < from)
				for(const node of Array.from(pages).slice(to))
					this.removePage(node);
		}
		
		
		get spreadSize(){
			return +this.pagesList.dataset.spreadSize || 1;
		}
		set spreadSize(to){
			const {dataset} = this.pagesList;
			const from = +dataset.spreadSize || 1;
			to = Math.max(1, +to || 1);
			if(to !== from){
				(to > 1)
					? dataset.spreadSize = to
					: delete dataset.spreadSize;
				this.refresh();
			}
		}
		
		
		addPage(){
			
			// Reuse an existing node if possible
			if(sparePages.size){
				const el = Array.from(sparePages)[0];
				sparePages.delete(el);
				return el;
			}
			
			const el        = this.div(this.classNames.page);
			const hotspots  = this.div(this.classNames.hotspotList);
			const canvas    = document.createElement("canvas");
			const context   = canvas.getContext("2d");
			const renderMax = this.getCanvasSize();
			canvas.width    = renderMax;
			canvas.height   = renderMax;
			
			Object.defineProperties(el, {
				[K_HOTSPOTS]: {value: hotspots},
				[K_CANVAS]:   {value: canvas},
				[K_CONTEXT]:  {value: context},
			});
			
			el.appendChild(canvas);
			el.appendChild(hotspots);
			return el;
		}
		
		
		removePage(node){
			if(node && this.pagesList.contains(node)){
				this.pagesList.removeChild(node);
				sparePages.add(node);
			}
		}
		
		
		getCanvasSize(){
			const width   = screen.availWidth;
			const height  = screen.availHeight;
			const density = window.devicePixelRatio;
			return Math.max(width, height) * density;
		}
		
		
		/* Section: Hotspot handling */
		
		setHotspots(hotspotData, pageNode){
			const listNode     = pageNode[K_HOTSPOTS];
			const {children}   = listNode;
			const currentCount = children.length;
			const newCount     = hotspotData.length;
			
			if(newCount > currentCount)
				for(let i = currentCount; i < newCount; ++i){
					const data    = hotspotData[i];
					const hotspot = this.addHotspot(data);
					listNode.appendChild(hotspot);
				}
			
			else if(newCount < currentCount)
				for(const node of Array.from(children).slice(newCount))
					this.removeHotspot(node);
			
			const context = pageNode[K_CONTEXT];
			const {width, height} = pageNode[K_CANVAS];
			for(let i = 0; i < newCount; ++i){
				const hotspot = hotspotData[i];
				this.setHotspotBounds(children[i], hotspot, width, height);
				
				if(this.showHotspots && !hotspot.border.thickness){
					hotspot.border.thickness = 2;
					hotspot.draw(context);
					hotspot.border.thickness = 0;
				}
				else hotspot.draw(context);
			}
		}
		
		
		addHotspot(data){
			const el = this.div("troff-view-hotspot");
			el[K_HOTSPOT] = data;
			el.addEventListener("click", event => {
				const hotspot = el[K_HOTSPOT];
				if(!hotspot) return;
				if(hotspot.targetURI)
					window.location.replace(hotspot.targetURI);
				else if(hotspot.targetDest)
					this.goToAnchor(hotspot.targetDest);
				event.preventDefault();
				return false;
			});
			return el;
		}
		
		
		setHotspotBounds(el, hotspot, width, height){
			const {style} = el;
			style.left    = `${hotspot.x / width  * 100}%`;
			style.top     = `${hotspot.y / height * 100}%`;
			style.right   = `${(width  - (hotspot.x + hotspot.width))  / width  * 100}%`;
			style.bottom  = `${(height - (hotspot.y + hotspot.height)) / height * 100}%`;
		}
		
		
		/* Section: Navigation */

		get page(){
			const pages = this.calculateVisibility()
				.map((value, index) => [index, value])
				.sort((a, b) => {
					if(a[1] > b[1]) return -1;
					if(a[1] < b[1]) return  1;
					if(a[0] < b[0]) return -1;
					if(a[0] > b[0]) return  1;
					return 0;
				});
			return (pages[0] || [0])[0];
		}
		set page(index){
			if(!this.pagesList) return;
			const pages = this.pagesList.children;
			const count = pages.length;
			if(index <= 0)
				this.root.scrollTop = 0;
			else{
				if(index >= count) index = count - 1;
				const node = pages[index];
				if(!node) return;
				this.root.scrollTop = node.offsetTop;
			}
		}
		
		
		goToAnchor(dest){
			const {anchors} = this.renderer;
			const targetObj = anchors.get(dest);
			if(targetObj)
				this.page = targetObj.page.index - 1;
		}
		
		

		calculateVisibility(){
			const {numPages} = this;
			const values     = new Array(numPages);
			const viewArea   = this.root.getBoundingClientRect();
			for(let i = 0; i < numPages; ++i){
				const page = this.pagesList.children[i];
				const box = page.getBoundingClientRect();
				const {top, bottom, height} = box;
				
				// Completely out-of-sight
				if(bottom < viewArea.top || top > viewArea.bottom)
					values[i] = 0;
				else{
					let hidden = 0;
					if(top < viewArea.top)
						hidden += Math.abs(viewArea.top - top);
					if(bottom > viewArea.bottom)
						hidden += Math.abs(viewArea.bottom - bottom);
					values[i] = 1 - (hidden / height);
				}
			}
			return values;
		}
	}

	Object.assign(TroffView.prototype, {
		classNames: {
			root:        "troff-view",
			zoomLayer:   "troff-view-zoom",
			pagesList:   "troff-view-pages",
			page:        "troff-view-page",
			hotspotList: "troff-view-hotspots",
			hotspot:     "troff-view-hotspot",
		},
		showHotspots: false,
	});

	return TroffView;
}());

window.TroffView = TroffView;
