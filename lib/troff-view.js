"use strict";

const {shell}        = require("electron");
const CanvasRenderer = require("./postproc/canvas.js");
const hotspotLists   = new WeakMap();


class TroffView{
	
	constructor(element){
		this.el = element || document.createElement("div");
		this.el.classList.add("troff-view");
		
		const renderer   = new CanvasRenderer();
		const canvasses  = [];
		let page         = 1;
		let maxPages     = 0;
		let showHotspots = false;
		
		Object.defineProperties(this, {
			renderer:  { get: () => renderer },
			canvasses: { get: () => canvasses },
			
			maxPages: {
				get: () => maxPages,
				set: to => {
					to = Math.max(0, +to || 1);
					if(to !== maxPages){
						maxPages = to;
						if(to >= canvasses.length){
							for(let i = canvasses.length; i < to; ++i)
								this.addPage();
							this.refresh();
						}
					}
				}
			},
			
			page: {
				get: () => page,
				set: to => {
					const max = renderer.pages.length - 1;
					if(to > max) to = max;
					if(to < 1)   to = 1;
					if(to !== page){
						page = to;
						this.refresh();
					}
				}
			},
			
			showHotspots: {
				get: () => showHotspots,
				set: to => {
					if((to = !!to) !== showHotspots){
						showHotspots = to;
						this.refresh();
					}
				}
			}
		});
		
		this.maxPages = 1;
		document.fonts.ready.then(() => this.refresh());
	}
	
	
	addPage(){
		const el      = document.createElement("div");
		const canvas  = document.createElement("canvas");
		const context = canvas.getContext("2d");
		
		el.appendChild(canvas);
		this.el.appendChild(el);
		this.canvasses.push({el, context});
	}
	
	
	load(source){
		this.renderer.process(source);
		this.refresh();
	}
	
	
	jumpToAnchor(name){
		const anchor = this.renderer.anchors.get(name);
		if(anchor)
			this.page = anchor.page.index;
	}
	
	
	refresh(){
		const {maxPages, renderer} = this;
		if(!renderer.pages || !renderer.pages.length)
			return;
		
		for(let i = 0; i < maxPages; ++i){
			const page = renderer.pages[this.page + i];
			const {context, el} = this.canvasses[i];
			if(!page){
				el.hidden = true;
				continue;
			}
			el.hidden = false;
			renderer.render(page, context);
			
			// Update canvas hotspots
			let list = hotspotLists.get(page);
			if(!list){
				list = document.createElement("div");
				list.classList.add("hotspot-list");
				hotspotLists.set(page, list);
				
				const {width, height} = context.canvas;
				for(const hotspot of renderer.hotspots){
					const el = document.createElement("a");
					
					el.addEventListener("click", event => {
						if(hotspot.targetURI)
							shell.openExternal(hotspot.targetURI);
						else if(hotspot.targetDest)
							this.jumpToAnchor(hotspot.targetDest);
						event.preventDefault();
						return false;
					});
					
					const {style} = el;
					style.left    = `${hotspot.x / width  * 100}%`;
					style.top     = `${hotspot.y / height * 100}%`;
					style.right   = `${(width  - (hotspot.x + hotspot.width))  / width  * 100}%`;
					style.bottom  = `${(height - (hotspot.y + hotspot.height)) / height * 100}%`;
					list.appendChild(el);
				}
			}
			if(!el.contains(list)){
				if(el.childElementCount > 1)
					el.removeChild(el.lastElementChild);
				el.appendChild(list);
			}
			
			// Display borders for hotspots which have them
			for(const hotspot of renderer.hotspots){
				if(this.showHotspots && !hotspot.border.thickness){
					hotspot.border.thickness = 2;
					hotspot.draw(context);
					hotspot.border.thickness = 0;
				}
				else hotspot.draw(context);
			}
		}
	}
}


module.exports = TroffView;
