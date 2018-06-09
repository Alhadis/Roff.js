"use strict";

const TTYRenderer   = require("./renderer.js");
const PageReference = require("../../system/page-reference.js");


/**
 * Component for displaying and browsing manpages.
 * @class
 */
class TTYViewer{
	
	/**
	 * Instantiate a new TTYViewer instance.
	 *
	 * @constructor
	 * @param {Object} [attr={}]
	 *    An object with any of the following properties:
	 *
	 *    @property {HTMLElement} element
	 *       Container element which holds the rendered output.
	 *       Existing contents will be replaced: if omitted, an
	 *       <output> element is created by {@link #buildElement}.
	 *
	 *    @property {HTMLElement} parentElement
	 *       Specifies which node to attach the container element to.
	 *
	 *       @example <caption>Attaching during construction</caption>
	 *                new TTYViewer({ parentElement: document.body });
	 *
	 *       @example <caption>Creating first, attaching later</caption>
	 *                let view = new TTYViewer();
	 *                document.body.appendChild(view.element);
	 *                view.parentElement === document.body;
	 *
	 *    @property {Boolean} [autolink=true]
	 *       Navigate to other manpages when clicking links
	 *       of the form <a href="man://page/1">page(1)</a>.
	 *       If navigation is successful, the {@link onChange}
	 *       callback is called, if one was provided.
	 *
	 *    @property {Function} [onError=null]
	 *       Callback function triggered when a problem was encountered
	 *       whilst loading or rendering a manpage. An {@link Error} is
	 *       passed as an argument; see {@link PageLoader} for details.
	 *
	 *    @property {Function} [onChange=null]
	 *       Callback triggered when navigating to another manpage. No
	 *       arguments are passed: the path/name of the activated page
	 *       can be accessed via the {@link #currentPage} property.
	 */
	constructor(attr = {}){
		this.landmarks = new Map();
		this.renderer = new TTYRenderer();
		
		// Event handlers
		if(attr.onError)  this.onError  = attr.onError;
		if(attr.onChange) this.onChange = attr.onChange;
		this.handleClick = this.handleClick.bind(this);
		
		// Define `autolink` getter/setter functions
		let autolink = false;
		Object.defineProperty(this, "autolink", {
			get: () => !!autolink,
			set: to => {
				if((to = !!to) === autolink) return;
				(autolink = to)
					? this.element.addEventListener("mouseup", this.handleClick)
					: this.element.removeEventListener("mouseup", this.handleClick);
			},
		});
		
		// Attach to DOM
		attr.element
			? this.element = attr.element
			: this.buildElement(attr);
		
		// Enable autolinking by default
		this.autolink = (undefined !== attr.autolink)
			? !!attr.autolink
			: true;
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
	 * Construct the instance's default container element.
	 *
	 * @param {Object} [attr={}]
	 * @internal
	 */
	buildElement(attr = {}){
		const element = document.createElement("output");
		element.className = "manpage-view";

		Object.assign(element.style, {
			fontSize:   this.pointSize,
			fontFamily: this.fontFamily,
			lineHeight: this.lineHeight,
			display:    "block",
			whiteSpace: "pre",
		});
		
		this.element = element;
		this.elementStyle = window.getComputedStyle(this.element);
		
		// Make element-related properties read-only
		Object.defineProperties(this, {
			element:      {writable: false},
			elementStyle: {writable: false},
		});
		
		if(attr.parentElement)
			attr.parentElement.appendChild(this.element);
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
		if(this.onChange)
			this.onChange();
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
			dest = PageReference.slugify(dest);
			dest = this.headings.get(dest);
			if(dest && this.element.contains(dest))
				dest.scrollIntoView();
		}
	}
	
	
	/**
	 * Navigation handler for responding to clicks on `man://` links.
	 *
	 * Only used when {@link #autolink} is enabled. When first used,
	 * the method is bound to the calling instance and assigned to its
	 * `handleClick` property to simplify unregistration of listeners:
	 *
	 * @example <caption>Removing an event listener</caption>
	 *    view.element.removeEventListener("mouseup", view.handleClick);
	 *    view.handleClick !== TTYViewer.prototype.handleClick;
	 *
	 * @param {MouseEvent} event
	 * @internal
	 */
	handleClick(event){
		const target = event.target || event.currentTarget;
		const link = target.closest("a[href^='man://']");
		if(!link) return;
		
		event.preventDefault();
		const parts = PageReference.fromURL(link.href);
		(null === parts)
			? this.onError("Malformed link: " + link.href)
			: this.formatPage(parts.name, parts.section)
				.then(src => this.content = src)
				.catch(e => this.onError(e));
	}
	
	
	/**
	 * Map heading elements to their normalised, URL-safe names.
	 * Used for deep-linking to specific manpage sections, à la
	 * an ordinary web permalink.
	 *
	 * NOTE: Headings are converted to lowercase and stripped
	 * of anything which isn't a dash or ASCII word character.
	 * Therefore, to link to "NAME", use `landmarks.get("name")`.
	 * Conversion is performed by {@link PageReference.slugify},
	 * and may be disabled by the {@link preserveCase} argument.
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
	 * @param {Boolean} [preserveCase=false]
	 *    Preserve hot-link capitalisation and formatting. Only
	 *    leading and trailing whitespace is stripped: the rest
	 *    of the heading's contents are treated verbatim.
	 *
	 * @see https://en.wikipedia.org/wiki/Clean_URL#Slug
	 * @example <caption>Mapping conventional manpage sections</caption>
	 *    landmarks => Map([
	 *        ["name",     <b>NAME</b>],
	 *        ["synopsis", <b>SYNOPSIS</b>],
	 *        ["see-also", <b>SEE ALSO</b>],
	 *    ]);
	 */
	remapLandmarks(selector = "b", preserveCase = false){
		this.landmarks.clear();
		
		for(const tag of this.element.querySelectorAll(selector)){
			if(!this.isValidHeading(tag))
				continue;
			
			let title = tag.textContent.trim();
			if(!preserveCase)
				title = PageReference.slugify(title);
			
			this.landmarks.set(title, tag);
		}
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
