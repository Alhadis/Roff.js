"use strict";

let shell = null;

module.exports = {
	get Postprocessor()  {return require("./lib/postprocessor.js")},
	get CanvasRenderer() {return require("./lib/canvas/canvas.js")},
	get HTMLTTY()        {return require("./lib/html-tty/html-tty.js")},
	get TextGrid()       {return require("./lib/html-tty/text-grid.js")},
	get ManPager()       {return require("./lib/html-tty/manpager.js")},
	get TroffType()      {return require("./lib/troff-type.js")},
	get TroffView()      {return require("./lib/canvas/troff-view.js")},
	
	// Expose a shared cache for external operations
	get shell(){
		return null === shell
			? shell = new (require("./lib/shell-cache.js"))
			: shell;
	},
};
