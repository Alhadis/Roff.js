/**
 * @file Entry point into the Roff.js module.
 *
 * The contents of this library are subject to change on a whim.
 * Sticking to this file's named exports is therefore strongly
 * advised.
 */

import Postprocessor       from "./postproc/postprocessor.mjs";
import TextGrid            from "./postproc/text-grid.mjs";
import TroffCanvasRenderer from "./postproc/canvas/renderer.mjs";
import TroffCanvasViewer   from "./postproc/canvas/viewer.mjs";
import TTYRenderer         from "./postproc/tty/renderer.mjs";
import TTYViewer           from "./postproc/tty/viewer.mjs";
import ManAdapter          from "./adapters/man/man.mjs";
import GroffAdapter        from "./adapters/troff/groff.mjs";

export {
	Postprocessor,
	TextGrid,
	TroffCanvasRenderer,
	TroffCanvasViewer,
	TTYRenderer,
	TTYViewer,
	ManAdapter,
	GroffAdapter,
};

export {
	parseManURL,
	resolveManRef,
} from "./adapters/utils.mjs";
