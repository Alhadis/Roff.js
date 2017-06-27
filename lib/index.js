"use strict";

module.exports = {
	devices: {
		canvas: require("./devices/canvas.js"),
		tty:    require("./devices/tty.js"),
	},
	charNames: require("./charnames.js"),
	TextGrid:  require("./text-grid.js"),
	tokeniser: require("./tokeniser.js"),
};
