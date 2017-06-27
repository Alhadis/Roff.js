"use strict";

const {tokenise, tokenTypes} = require("../../lib/tokeniser.js");
const renderToCanvas = require("./renderer.js");
const DeviceInfo = require("./device-info.js");


class DocumentOutline{
	
	constructor(data, pageSize = null){
		this.pageSize = pageSize || DeviceInfo.paperSize;
		this.tokenisePages(data);
		
		let page = 0;
		Object.defineProperties(this, {
			page: {
				get: () => page,
				set: to => {
					const {length} = this.pages;
					if(to >= length) to = length - 1;
					if(to < 0)       to = 0;
				}
			},
			
			currentPage: {
				get: () => this.pages[page] || null,
			}
		});
	}
	
	
	tokenisePages(data){
		this.pages     = [];
		const prologue = [];
		let pageIndex  = 0;
		let pageObject = null;
		
		const tokens = "string" === typeof data
			? tokenise(data)
			: data;
		
		const {length} = tokens;
		for(let i = 0; i < length; ++i){
			const token = tokens[i];
			const type  = token[0];
			const data  = token.slice(1).join("").trim();
			
			switch(type){
				case tokenTypes.COMMENT:
					continue;
				
				case tokenTypes.BEGIN_PAGE:
					pageIndex  = +data;
					pageObject = {pageIndex, pageSize: this.pageSize, tokens: [...prologue]};
					this.pages[pageIndex - 1] = pageObject;
					break;
				
				case tokenTypes.DEVICE_CTRL:
					if(/^\s*papersize=(\d+(?:\.\d+)?)([icpP]),(\d+(?:\.\d+)?)([icpP])/.test(data)){
						const width   = +RegExp.$1 * PaperSizes.units[RegExp.$2][0];
						const height  = +RegExp.$3 * PaperSizes.units[RegExp.$4][0];
						this.pageSize = [width, height];
						if(pageObject)
							pageObject.pageSize = this.pageSize;
						break;
					}
					// Fall through
				
				default: pageIndex
					? pageObject.tokens.push(token)
					: prologue.push(token);
			}
		}
	}
	
	
	/**
	 * Render the currently-active page object within a drawing context.
	 *
	 * @param {CanvasRenderingContext2D} context
	 * @private
	 */
	render(context){
		const page = this.currentPage;
		if(page){
			renderToCanvas(context, page.tokens);
			console.log("?");
		}
	}
}


module.exports = DocumentOutline;
