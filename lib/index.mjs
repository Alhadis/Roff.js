/**
 * @file Entry point into the Roff.js library.
 */

import Phototypesetter     from "./postproc/phototypesetter.mjs";
import Postprocessor       from "./postproc/postprocessor.mjs";
import TroffCanvasRenderer from "./postproc/canvas/renderer.mjs";
import TroffCanvasViewer   from "./postproc/canvas/viewer.mjs";
import TextGrid            from "./postproc/tty/text-grid.mjs";
import TTYRenderer         from "./postproc/tty/renderer.mjs";
import ManAdapter          from "./adapters/man/man.mjs";
import GroffAdapter        from "./adapters/troff/groff.mjs";

export {
	Phototypesetter,
	Postprocessor,
	TextGrid,
	TroffCanvasRenderer,
	TroffCanvasViewer,
	TTYRenderer,
	ManAdapter,
	GroffAdapter,
};

export * from "./utils/env-shims.mjs";
export * from "./utils/general.mjs";
export * from "./utils/shell.mjs";
