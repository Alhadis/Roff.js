"use strict";

class DeviceGlyph{
	
	constructor(name, metrics, type, code, entityName = ""){
		this.names   = [];
		this.unnamed = false;
		"---" === name
			? this.unnamed = true
			: this.names.push(name);
		
		metrics                   = metrics.split(/,/);
		this.width                = +metrics[0] || 0;
		this.height               = +metrics[1] || 0;
		this.depth                = +metrics[2] || 0;
		this.italicCorrection     = +metrics[3] || 0;
		this.leftItalicCorrection = +metrics[4] || 0;
		this.subscriptCorrection  = +metrics[5] || 0;
		
		this.hasAscender  = false;
		this.hasDescender = false;
		switch(+type){
			case 1:
				this.hasDescender = true;
				break;
			case 2:
				this.hasAscender  = true;
				break;
			case 3:
				this.hasDescender = true;
				this.hasAscender  = true;
				break;
		}
		
		this.code = /^0/.test(code)
			? parseInt(code, 8)
			: parseInt(code);
		
		this.entityName = entityName;
	}
}


module.exports = DeviceGlyph;
