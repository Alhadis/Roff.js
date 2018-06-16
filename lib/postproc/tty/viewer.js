"use strict";

const EventEmitter = require("events");
const TTYRenderer  = require("./renderer.js");


/**
 * Component for displaying and interacting with manpages.
 *
 * @event   link
 * @param   {String} url
 * @summary Emitted when the user clicks a link within the container element.
 *
 * @event   render
 * @summary Emitted when a manpage finishes rendering.
 */
class TTYViewer extends EventEmitter {
	
	/**
	 * Instantiate a new TTYViewer instance.
	 *
	 * @constructor
	 * @param {HTMLElement} [element=null]
	 *    Container element which holds rendered output. Its contents are
	 *    replaced each time a manpage is rendered. If null, a detached
	 *    <output> element is created for manual DOM insertion.
	 */
	constructor(element = null){
		super();
		this.landmarks = new Map();
		this.renderer = new TTYRenderer();
		
		if(!element){
			element = document.createElement("output");
			element.className = "tty-viewer";
			Object.assign(element.style, {
				fontSize:   this.pointSize,
				fontFamily: this.fontFamily,
				lineHeight: this.lineHeight,
				display:    "block",
				whiteSpace: "pre",
			});
		}
		
		// Make element-related properties read-only
		Object.defineProperties(this, {
			element:      {value: element},
			elementStyle: {value: window.getComputedStyle(element)},
		});
		
		// Event handlers
		element.addEventListener("click", event => {
			const target = event.target || event.currentTarget;
			const link = target.closest("a[href]");
			if(link){
				event.preventDefault();
				this.emit("link", link.href);
			}
		});
	}
	
	
	/**
	 * HTML content of the pager's container.
	 * @property {String}
	 */
	get content(){
		return this.element
			? this.element.innerHTML
			: "";
	}
	set content(input){
		if(this.element && input !== this.content)
			this.element.innerHTML = input;
	}
	

	/**
	 * Width of the container element, measured in columns.
	 * @property {Number}
	 * @default 80
	 * @readonly
	 */
	get columns(){
		if(this.element)
			return Math.ceil(this.element.offsetWidth / this.pointSize);
		return ("object" === typeof process)
			? process.stdout.columns
			: 80;
	}
	
	
	/**
	 * Height of the container element, measured in lines.
	 * @property {Number}
	 * @default 25
	 * @readonly
	 */
	get rows(){
		if(this.element)
			return Math.ceil(this.element.offsetHeight / this.pointSize);
		return ("object" === typeof process)
			? process.stdout.rows
			: 25;
	}
	
	
	/**
	 * Name of the typeface(s) used for displaying rendered output.
	 * @property {String} fontFamily
	 * @default "Menlig, monospace"
	 */
	get fontFamily(){
		return this.element
			? this.elementStyle.fontFamily
			: "Menlig, monospace";
	}
	set fontFamily(to){
		if(!this.element) return;
		if(to = String(to || ""))
			this.elementStyle.fontFamily = to;
	}
	
	
	/**
	 * Font-size of the rendered output, measured in pixels.
	 * @property {Number} pointSize
	 * @default 16
	 */
	get pointSize(){
		return this.element
			? parseFloat(this.elementStyle.fontSize)
			: 16;
	}
	set pointSize(to){
		if(!this.elment) return;
		if(to = Math.max(0, parseFloat(to) || 0))
			this.element.style.fontSize = `${to}px`;
	}
	
	
	/**
	 * Font-size of the rendered output, measured in EM units.
	 * @property {Number}
	 */
	get pointSizeInEms(){
		return this.pointSize / 16;
	}
	set pointSizeInEms(to){
		to = parseFloat(to) || 0;
		this.pointSize = to * 16;
	}
	
	
	/**
	 * Leading expressed as a multiplier of point-size.
	 * @property {Number} lineHeight
	 * @default 1.5
	 */
	get lineHeight(){
		return this.element
			? parseFloat(this.elementStyle.lineHeight)
			: 1.5;
	}
	set lineHeight(to){
		if(!this.element) return;
		if((to = parseFloat(to) || 0) >= 0)
			this.element.style.lineHeight = to;
	}
	
	
	/**
	 * Post-process and display formatted troff(1) output.
	 *
	 * @param {String} input
	 * @internal
	 */
	render(input){
		if(!input) return;
		this.content = this.renderer.process(input);
		this.remapLandmarks();
		this.emit("render");
	}
	
	
	/**
	 * Scroll to a DOM element or named document section.
	 *
	 * @example <caption>Scrolling to `SYNOPSIS`</caption>
	 *    // The following lines are equivalent
	 *    goToAnchor("synopsis");
	 *    goToAnchor(landmarks.get("synopsis"));
	 *
	 *    const arbitraryElement = element.querySelector("…");
	 *    goToAnchor(document.querySelector("#synopsis"));
	 *
	 * @param {HTMLElement|String} dest
	 * @return {HTMLElement|null}
	 *    Reference to heading element, or null if `dest` didn't
	 *    match any recognised section in the current document.
	 */
	goToAnchor(dest){
		if(dest instanceof HTMLElement)
			dest.scrollIntoView();
		else{
			dest = this.formatSlug(dest);
			dest = this.headings.get(dest);
			if(dest && this.element.contains(dest))
				dest.scrollIntoView();
		}
	}
	
	
	/**
	 * Map heading elements to their normalised, URL-safe names.
	 * Used for deep-linking to specific manpage sections, à la
	 * an ordinary web permalink.
	 *
	 * NOTE: Headings are converted to lowercase and stripped
	 * of anything which isn't a dash or ASCII word character.
	 * Therefore, to link to "NAME", use `landmarks.get("name")`.
	 *
	 * If slug-reformatting results in multiple headings with
	 * the same identifier, their unmodified forms are stored
	 * for disambiguating targeted fragments:
	 *
	 *    man://mdoc/7#Cc -> The `.Cc` macro
	 *    man://mdoc/7#CC -> The `CC` environment variable
	 *    man://mdoc/7#cc -> No matching case: resolves to
	 *                       whichever section comes first.
	 * 
	 * @param {String} [selector="b"]
	 *    A CSS selector governing which elements are "headings".
	 *    In addition, some heuristics are performed in order to
	 *    recognise the element as a valid-looking section title.
	 *    See {@link isValidHeading} for the exact semantics.
	 * 
	 * @param {Boolean} [noFormat=false]
	 *    Preserve hot-link capitalisation and formatting. Only
	 *    leading and trailing whitespace is stripped: the rest
	 *    of the heading's contents are treated verbatim.
	 *
	 * @example <caption>Mapping conventional manpage sections</caption>
	 *    landmarks => Map([
	 *        ["name",     <b>NAME</b>],
	 *        ["synopsis", <b>SYNOPSIS</b>],
	 *        ["see-also", <b>SEE ALSO</b>],
	 *    ]);
	 */
	remapLandmarks(selector = "b", noFormat = false){
		this.landmarks.clear();
		
		for(const tag of this.element.querySelectorAll(selector)){
			if(!this.isValidHeading(tag))
				continue;
			
			let title = tag.textContent.trim();
			if(!noFormat)
				title = this.formatSlug(title);
			
			this.landmarks.set(title, tag);
		}
	}
	
	
	/**
	 * Convert a string into a lowercase, URL-friendly identifier.
	 *
	 * @example formatSlug("Here's a title.") == "heres-a-title"
	 * @param {String} input
	 * @return {String}
	 */
	formatSlug(input){
		return (input || "").toString()
			.toLowerCase()
			.replace(/(\w)'(re)(?=\s|$)/g, "$1-are")
			.replace(/(\w)'s(?=\s|$)/g, "$1s")
			.replace(/[^\w$]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "");
	}
	
	
	/**
	 * Determine whether a DOM node resembles a section heading.
	 *
	 * Matching elements must occupy an entire line, be written
	 * solely in uppercase, follow at least one fully-blank line,
	 * and be at least 3 characters in length.
	 * 
	 * @param {Element} tag
	 * @return {Boolean}
	 * @internal
	 */
	isValidHeading(tag){
		if(tag === this.element.firstChild)
			return true;
		
		// Not written in ALL CAPS? Ignore it.
		const text = tag.textContent;
		if(!/[A-Z]/.test(text) || /[a-z]/.test(text))
			return false;
		
		const blankBefore = /(?:^|(?:^|\n)[ \t]*\n)[ \t]*$/;
		const blankAfter  = /^[ \t]*(?:$|\n)/;
		const before      = tag.previousSibling;
		const after       = tag.nextSibling;
		
		return (
			before && before.nodeType === Element.TEXT_NODE &&
			after  && after.nodeType  === Element.TEXT_NODE &&
			before.textContent.match(blankBefore) &&
			after.textContent.match(blankAfter)
		);
	}
}


module.exports = TTYViewer;
