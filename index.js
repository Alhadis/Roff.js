"use strict";

let pages = null;
let shell = null;

module.exports = {
	
	// Core components
	get Postprocessor()  {return require("./lib/postprocessor.js")},
	get ShellCache()     {return require("./lib/shell-cache.js")},
	get TroffType()      {return require("./lib/troff-type.js")},
	
	// Postprocessor: Previews of graphical/PDF output using HTML5 <canvas>
	get CanvasRenderer() {return require("./lib/canvas/canvas.js")},
	get TroffView()      {return require("./lib/canvas/troff-view.js")},
	
	// Postprocessor: HTML stylised to resemble terminal output
	get HTMLTTY()        {return require("./lib/html-tty/html-tty.js")},
	get TextGrid()       {return require("./lib/html-tty/text-grid.js")},
	get TTYView()        {return require("./lib/html-tty/tty-view.js")},
	
	// Utility interfaces for loading and formatting manpages
	get PageLoader()     {return require("./lib/man/page-loader.js")},
	get PageReference()  {return require("./lib/man/page-reference.js")},
	
	
	// Shared PageLoader instance for pooling loaded manual-pages
	get pages(){
		return null === pages
			? pages = new this.PageLoader
			: pages;
	},
	
	// Shared cache for pooling results of external operations
	get shell(){
		return null === shell
			? shell = new this.ShellCache
			: shell;
	},
};
