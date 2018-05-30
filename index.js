"use strict";

let shell = null;

module.exports = {
	get Postprocessor()  {return require("./lib/postprocessor.js")},
	get CanvasRenderer() {return require("./lib/postproc/canvas.js")},
	get HTMLTTY()        {return require("./lib/postproc/html-tty.js")},
	get TextGrid()       {return require("./lib/text-grid.js")},
	get ManPager()       {return require("./lib/manpager.js")},
	get TroffType()      {return require("./lib/troff-type.js")},
	get TroffView()      {return require("./lib/troff-view.js")},
	
	// Expose a shared cache for external operations
	get shell(){
		return null === shell
			? shell = new (require("./lib/shell-cache.js"))
			: shell;
	},
};
