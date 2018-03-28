"use strict";

const {readFile} = require("fs");
const {shell}    = require("electron");
const CanvasRenderer = require("./postproc/canvas.js");

const K_HOTSPOTS = Symbol("TroffViewHotspots");
const K_HOTSPOT  = Symbol("TroffViewHotspot");
const K_CANVAS   = Symbol("TroffViewCanvas");
const K_CONTEXT  = Symbol("TroffViewContext");
const sparePages = new Set();
const spareSpots = new Set();

class TroffView{
	
	constructor(attr = {}){
		const parentEl = attr.parentElement || null;
		delete attr.parentElement; // Omit from instance properties
		
		Object.assign(this, attr);
		const {classNames} = this;
		this.root          = this.div(classNames.root);
		this.zoomLayer     = this.div(classNames.zoomLayer);
		this.pagesList     = this.div(classNames.pagesList);
		
		this.zoomLayer.appendChild(this.pagesList);
		this.root.appendChild(this.zoomLayer);
		parentEl && parentEl.appendChild(this.root);
		
		this.renderer = new CanvasRenderer();
		this.fontListener = () => this.refresh();
		document.fonts.addEventListener("loadingdone", this.fontListener);
	}
	
	
	div(attr = {}){
		const div = document.createElement("div");
		if("string" === typeof attr)
			attr = {className: attr};
		return Object.assign(div, attr || {});
	}
	
	
	load(source){
		this.renderer.process(source);
		this.numPages = this.renderer.pages.length - 1;
		this.refresh();
	}
	
	
	loadFile(path){
		return new Promise((resolve, reject) => {
			readFile(path, "utf8", (error, data) =>
				error ? reject(error) : resolve(data));
		})
		.then(source => this.load(source))
		.catch(error => {
			console.error(`[TroffView::loadFile] Error loading ${path}`);
			console.dir(error);
		});
	}
	
	
	refresh(){
		const {numPages} = this;
		for(let i = 0; i < numPages; ++i){
			const page = this.renderer.pages[i + 1];
			if(!page) return;
			
			const node = this.pagesList.children[i];
			const context = node[K_CONTEXT];
			this.renderer.render(page, context);
			const width = Math.round(page.width / this.renderer.maxPageWidth * 100);
			node.style.width = `${width / this.spreadSize}%`;
			this.setHotspots(this.renderer.hotspots, node);
		}
	}
	
	
	/* Section: Page handling */
	
	get pages(){
		return this.pagesList
			? Array.from(this.pagesList.children)
			: [];
	}
	
	get numPages(){
		return this.pagesList
			? this.pagesList.childElementCount
			: 0;
	}
	set numPages(to){
		const pages = this.pagesList.children;
		const from = pages.length;
		to = Math.max(1, +to || 1);
		
		if(to > from)
			for(let i = from; i < to; ++i)
				this.pagesList.appendChild(this.addPage());
		
		else if(to < from)
			for(const node of Array.from(pages).slice(to))
				this.removePage(node);
	}
	
	
	get spreadSize(){
		return +this.pagesList.dataset.spreadSize || 1;
	}
	set spreadSize(to){
		const {dataset} = this.pagesList;
		const from = +dataset.spreadSize || 1;
		to = Math.max(1, +to || 1);
		if(to !== from){
			(to > 1)
				? dataset.spreadSize = to
				: delete dataset.spreadSize;
			this.refresh();
		}
	}
	
	
	addPage(){
		
		// Reuse an existing node if possible
		if(sparePages.size){
			const el = Array.from(sparePages)[0];
			sparePages.delete(el);
			return el;
		}
		
		const el        = this.div(this.classNames.page);
		const hotspots  = this.div(this.classNames.hotspotList);
		const canvas    = document.createElement("canvas");
		const context   = canvas.getContext("2d");
		const renderMax = this.getCanvasSize();
		canvas.width    = renderMax;
		canvas.height   = renderMax;
		
		Object.defineProperties(el, {
			[K_HOTSPOTS]: {value: hotspots},
			[K_CANVAS]:   {value: canvas},
			[K_CONTEXT]:  {value: context},
		});
		
		el.appendChild(canvas);
		el.appendChild(hotspots);
		return el;
	}
	
	
	removePage(node){
		if(node && this.pagesList.contains(node)){
			this.pagesList.removeChild(node);
			sparePages.add(node);
		}
	}
	
	
	getCanvasSize(){
		const width   = screen.availWidth;
		const height  = screen.availHeight;
		const density = window.devicePixelRatio;
		return Math.max(width, height) * density;
	}
	
	
	/* Section: Hotspot handling */
	
	setHotspots(hotspotData, pageNode){
		const listNode     = pageNode[K_HOTSPOTS];
		const {children}   = listNode;
		const currentCount = children.length;
		const newCount     = hotspotData.length;
		
		if(newCount > currentCount)
			for(let i = currentCount; i < newCount; ++i){
				const data    = hotspotData[i];
				const hotspot = this.addHotspot(data);
				listNode.appendChild(hotspot);
			}
		
		else if(newCount < currentCount)
			for(const node of Array.from(children).slice(newCount))
				this.removeHotspot(node);
		
		const context = pageNode[K_CONTEXT];
		const {width, height} = pageNode[K_CANVAS];
		for(let i = 0; i < newCount; ++i){
			const hotspot = hotspotData[i];
			this.setHotspotBounds(children[i], hotspot, width, height);
			
			if(this.showHotspots && !hotspot.border.thickness){
				hotspot.border.thickness = 2;
				hotspot.draw(context);
				hotspot.border.thickness = 0;
			}
			else hotspot.draw(context);
		}
	}
	
	
	addHotspot(data){
		const el = this.div("troff-view-hotspot");
		el[K_HOTSPOT] = data;
		el.addEventListener("click", event => {
			const hotspot = el[K_HOTSPOT];
			if(!hotspot) return;
			if(hotspot.targetURI)
				shell.openExternal(hotspot.targetURI);
			else if(hotspot.targetDest)
				this.goToAnchor(hotspot.targetDest);
			event.preventDefault();
			return false;
		});
		return el;
	}
	
	
	setHotspotBounds(el, hotspot, width, height){
		const {style} = el;
		style.left    = `${hotspot.x / width  * 100}%`;
		style.top     = `${hotspot.y / height * 100}%`;
		style.right   = `${(width  - (hotspot.x + hotspot.width))  / width  * 100}%`;
		style.bottom  = `${(height - (hotspot.y + hotspot.height)) / height * 100}%`;
	}
	
	
	/* Section: Navigation */

	get page(){
		const pages = this.calculateVisibility()
			.map((value, index) => [index, value])
			.sort((a, b) => {
				if(a[1] > b[1]) return -1;
				if(a[1] < b[1]) return  1;
				if(a[0] < b[0]) return -1;
				if(a[0] > b[0]) return  1;
				return 0;
			});
		return (pages[0] || [0])[0];
	}
	set page(index){
		if(!this.pagesList) return;
		const pages = this.pagesList.children;
		const count = pages.length;
		if(index <= 0)
			this.root.scrollTop = 0;
		else{
			if(index >= count) index = count - 1;
			const node = pages[index];
			if(!node) return;
			this.root.scrollTop = node.offsetTop;
		}
	}
	
	
	goToAnchor(dest){
		const {anchors} = this.renderer;
		const targetObj = anchors.get(dest);
		if(targetObj)
			this.page = targetObj.page.index - 1;
	}
	
	

	calculateVisibility(){
		const {numPages} = this;
		const values     = new Array(numPages);
		const viewArea   = this.root.getBoundingClientRect();
		for(let i = 0; i < numPages; ++i){
			const page = this.pagesList.children[i];
			const box = page.getBoundingClientRect();
			const {top, bottom, height} = box;
			
			// Completely out-of-sight
			if(bottom < viewArea.top || top > viewArea.bottom)
				values[i] = 0;
			else{
				let hidden = 0;
				if(top < viewArea.top)
					hidden += Math.abs(viewArea.top - top);
				if(bottom > viewArea.bottom)
					hidden += Math.abs(viewArea.bottom - bottom);
				values[i] = 1 - (hidden / height);
			}
		}
		return values;
	}
}


Object.assign(TroffView.prototype, {
	classNames: {
		root:        "troff-view",
		zoomLayer:   "troff-view-zoom",
		pagesList:   "troff-view-pages",
		page:        "troff-view-page",
		hotspotList: "troff-view-hotspots",
		hotspot:     "troff-view-hotspot",
	},
	showHotspots: false,
});


module.exports = TroffView;
