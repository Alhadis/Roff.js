"use strict";

/**
 * @file Entry point into the Roff.js module.
 *
 * The contents of this library are subject to change on a whim.
 * Sticking to this file's named exports is therefore strongly
 * advised.
 */

module.exports = {
	get Postprocessor       (){ return require("./postproc/postprocessor.js");    },
	get TextGrid            (){ return require("./postproc/text-grid.js");        },
	get TroffCanvasRenderer (){ return require("./postproc/canvas/renderer.js");  },
	get TroffCanvasViewer   (){ return require("./postproc/canvas/viewer.js");    },
	get TTYRenderer         (){ return require("./postproc/tty/renderer.js");     },
	get TTYViewer           (){ return require("./postproc/tty/viewer.js");       },

	get ManPageLoader       (){ return require("./system/man/page-loader.js");    },
	get ManPageReference    (){ return require("./system/man/page-reference.js"); },
	get ShellCache          (){ return require("./system/shell-cache.js");        },
	get TroffType           (){ return require("./system/troff-type.js");         },
};
