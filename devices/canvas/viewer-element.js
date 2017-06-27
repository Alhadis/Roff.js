"use strict";

const DocumentOutline = require("./document-outline.js");


class ViewerElement{
	
	constructor(parentElement = null){
		this.canvas = document.createElement("canvas");
		this.context = this.canvas.getContext("2d");
		
		this.element = document.createElement("div");
		this.element.classList.add("troff-canvas");
		this.element.appendChild(this.canvas);
		
		this.hotspots = document.createElement("div");
		this.hotspots.classList.add("canvas-hotspots");
		this.element.appendChild(this.hotspots);
		
		let width  = 256;
		let height = 256;
		let docObj = null;
		
		Object.defineProperties(this, {
			width: {
				get: () => width,
				set: to => {
					if(to !== width){
						width = to;
						this.element.style.width = `${to}px`;
						this.canvas.width = to * window.devicePixelRatio;
						this.redraw();
					}
				}
			},
			
			height: {
				get: () => height,
				set: to => {
					if(to !== height){
						height = to;
						this.element.style.height = `${to}px`;
						this.canvas.height = to * window.devicePixelRatio;
						this.redraw();
					}
				}
			},
			
			document: {
				get: () => docObj,
				set: to => {
					if((to = to || null) === docObj) return;
					docObj = to;
					this.redraw();
				}
			}
		});
		
		if(parentElement){
			parentElement.appendChild(this.element);
			this.redraw();
		}
	}
	
	
	load(pageData){
		this.document = new DocumentOutline(pageData);
		console.log(this.document);
	}
	
	
	redraw(){
		if(this.document)
			this.document.render(this.context);
	}
}

module.exports = ViewerElement;
