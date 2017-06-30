"use strict";

module.exports = {
	Postprocessor: require("./lib/tokeniser.js"),
	TextGrid:      require("./lib/text-grid.js"),
	HTMLTTY:       require("./lib/postproc/html-tty.js"),
	TroffCanvas:   require("./lib/postproc/canvas.js"),
};
