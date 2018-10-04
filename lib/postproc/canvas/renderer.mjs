import Postprocessor from "../postprocessor.mjs";
import fontStyles    from "../tables/font-styles.mjs";
import symbolMaps    from "../tables/symbol-maps.mjs";
const {tokenTypes} = Postprocessor;


export default class TroffCanvasRenderer extends Postprocessor{
	
	constructor(){
		super();
		this.resetDrawingState();
		this.resetOutputProperties();
		this.resetFontStyles();
	}
	
	
	resetDrawingState(){
		this.devCmds       = [];
		this.charHeight    = 0;
		this.charSize      = 0;
		this.colour        = "#000";
		this.drawColour    = "#000";
		this.font          = ["", "px sans-serif"];
		this.invisible     = false;
		this.lineWidth     = 1;
		this.hotspot       = null;
		this.hotspots      = [];
		this.hotspotHold   = false;
		this.hotspotWrap   = false;
		this.reversed      = false;
		this.rotated       = false;
		this.slant         = 0;
		this.sourceFile    = "";
		this.tm            = null;
		this.x             = 0;
		this.y             = 0;
		
		if(this.context){
			this.context.lineCap  = "round";
			this.context.lineJoin = "round";
			this.context.moveTo(this.x, this.y);
		}
	}
	
	
	resetFontStyles(){
		this.fixKerning = true;
		this.fixQuotes  = true;
		this.fontStyles = Object.assign({}, fontStyles);
		this.fonts      = [0, 0, 0, 0, 0, 0, "S", "ZD"];
		this.fonts.forEach((font, index) => {
			font && this.mountFont(index, font);
		});
	}
	
	
	resetOutputProperties(){
		this.autoScale  = true;
		this.sizeScale  = 1000;
		this.scale      = 1;
		this.res        = [72000, 1, 1];
		this.pageWidth  = 612;
		this.pageHeight = 792;
		this.unitWidth  = 1000;
		
		// Setup default symbol-maps
		this.charMaps   = {};
		for(const keyedFonts in symbolMaps)
			keyedFonts.split(" ").forEach(fontName =>
				this.charMaps[fontName] = symbolMaps[keyedFonts]);
	}
	
	
	process(source){
		this.page       = [];
		this.pages      = [this.page];
		this.buffer     = null;
		this.anchors    = new Map();
		this.bookmarks  = [];
		this.resetDrawingState();
		super.process(source);
		if(null !== this.buffer){
			this.page.push(...this.buffer);
			this.buffer = null;
		}
		this.minPageWidth = this.minPageHeight = Number.MAX_VALUE;
		this.maxPageWidth = this.maxPageHeight = Number.MIN_VALUE;
		this.pages.forEach((page, index) => {
			page.index = index;
			if(!page.width)  page.width  = this.pageWidth;
			if(!page.height) page.height = this.pageHeight;
			if(page.width  > this.maxPageWidth)  this.maxPageWidth  = page.width;
			if(page.width  < this.minPageWidth)  this.minPageWidth  = page.width;
			if(page.height > this.maxPageHeight) this.maxPageHeight = page.height;
			if(page.height < this.minPageHeight) this.minPageHeight = page.height;
		});
		this.bookmarks = this.resolveOutline(this.bookmarks);
	}
	
	
	exec(cmd, data){
		if(!cmd) return;
		const isSquashableCmd = cmd === tokenTypes.TEXT_NORMAL || cmd === tokenTypes.MOVE_ABS_H;
		if(null !== this.buffer && !isSquashableCmd){
			if(cmd === tokenTypes.INFORM_EOL)
				this.page.push(...this.buffer);
			else{
				const squashedText = this.buffer.map(cmd => {
					return (cmd[0] === tokenTypes.TEXT_NORMAL) ? cmd[1] : "";
				}).join("");
				this.page.push([tokenTypes.TEXT_NORMAL, squashedText]);
			}
			this.buffer = null;
		}
		switch(cmd){
			case tokenTypes.BEGIN_PAGE:
				this.page = [...this.pages[0]];
				this.page.width  = this.pageWidth;
				this.page.height = this.pageHeight;
				!this.pages[data]
					? this.pages[data] = this.page
					: this.pages.splice(data, 0, this.page);
				return;
			case tokenTypes.DEVICE_CTRL:
				// Changes to paper-size persist between pages, so we check it upfront
				if(/^\s*X\S*\s+papersize=(\d+(?:\.\d+)?[icpPm]),(\d+(?:\.\d+)?[icpPm])/.test(data)){
					this.pageWidth  = this.parseLength(RegExp.$1);
					this.pageHeight = this.parseLength(RegExp.$2);
					if(this.page){
						this.page.width  = this.pageWidth;
						this.page.height = this.pageHeight;
					}
					return;
				}
				data = data.trim()
					.replace(/^X\S*\s+ps:exec\b/, "X ps: exec")
					.replace(/\n\+/g, "\n");
				
				// Named destinations and bookmarks must be known in advance too
				if(/\[\s*(\S.+)\s+pdfmark\b/.test(data)){
					data = RegExp.lastParen
						.replace(/(\d{4,6}) u/g,   (_,n) => n / this.sizeScale)
						.replace(/\\\[u00(..)\]/g, (_,n) => parseInt(n, 16));
					if(/^\/Dest\s+\/?(\S+)(.*)\s+\/DEST$/.test(data)){
						const name = RegExp.$1;
						const view = RegExp.$2.match(/\/View\s+\[\/FitH\s+(-?[\d.]+)\s*\]/) || [0];
						this.anchors.set(name, {page: this.page, offset: +view.pop()});
						return;
					}
					if(/^\/Dest\s+\/?(\S+)\s+\/Title\s+\((.+)\)\s+\/Level\s+(-?\d+)\s+\/OUT$/.test(data)){
						const level = Math.abs(RegExp.$3) || 1;
						this.bookmarks.push({target: RegExp.$1, title: RegExp.$2, level});
						return;
					}
				}
				break;
			case tokenTypes.TEXT_NORMAL:
				if(this.fixKerning){
					this.buffer = this.buffer || [];
					this.buffer.push([cmd, data]);
					return;
				}
				break;
			case tokenTypes.MOVE_ABS_H:
				if(this.fixKerning && null !== this.buffer){
					this.buffer.push([cmd, data]);
					return;
				}
		}
		this.page.push([cmd, data]);
	}
	
	
	resizeCanvas(){
		if(!this.autoScale) return;
		const {width, height} = this.page;
		const {canvas}     = this.context;
		const pixelDensity = window.devicePixelRatio;
		const renderThresh = Math.max(screen.availWidth, screen.availHeight) * pixelDensity;
		const aspectRatio  = height / width;
		
		// Portrait
		if(width < height){
			this.scale    = width * this.unitWidth / renderThresh;
			canvas.width  = renderThresh;
			canvas.height = renderThresh * aspectRatio;
		}
		
		// Landscape
		else{
			this.scale    = height * this.unitWidth / renderThresh;
			canvas.width  = renderThresh * (width / height);
			canvas.height = renderThresh;
		}
	}
	
	
	resolveOutline(nodes){
		const output = [];
		let prev, currentLevel = 1;
		
		for(let node of nodes){
			node.children = [];
			node.parent   = null;
			let {level}   = node;
			
			// Increase depth
			if(level > currentLevel){
				node.parent = prev;
				prev.children.push(node);
				currentLevel = level;
			}
			// Decrease depth
			else if(level < currentLevel)
				while(prev){
					if(prev.level <= level){
						currentLevel = prev.level;
						prev.parent
							? prev.parent.children.push(node)
							: output.push(node);
						node.parent = prev.parent;
						break;
					}
					prev = prev.parent;
				}
			// Same depth
			else{
				if(level > 1){
					prev = prev.parent || prev;
					prev.children.push(node);
					node.parent = prev;
				}
				else output.push(node);
			}
			prev = node;
		}
		
		return output;
	}
	
	
	render(page, context = null, clear = true){
		if(null !== context)
			this.context = context;
		if(clear)
			this.clearPage();
		
		this.resetDrawingState();
		this.page = page;
		this.resizeCanvas();
		
		for(const [type, data] of this.page){
			if(type === tokenTypes.DEVICE_CTRL)
				super.exec(type, data);
			else if(this.invisible)
				continue;
			else super.exec(type, data);
		}
	}
	
	
	clearPage(){
		const {canvas} = this.context;
		this.context.clearRect(0, 0, canvas.width, canvas.height);
	}
	
	
	drawArc(args){
		const h0 = this.x * this.scale;
		const v0 = this.y * this.scale;
		const h1 = +args[0];
		const v1 = +args[1];
		const h2 = +args[2];
		const v2 = +args[3];
		
		const endX = h1 + h2;
		const endY = v1 + v2;
		const N    = endX * endX + endY * endY;
		
		if(0 !== N){
			let K            = .5 - (h1 * endX + v1 * endY) / N;
			let centreX      = h1 + (K * endX);
			let centreY      = v1 + (K * endY);
			const radius     = Math.sqrt(centreX * centreX + centreY * centreY) / this.scale;
			const startAngle = Math.atan2(-centreY, -centreX);
			const endAngle   = Math.atan2(v1 + v2 - centreY, h1 + h2 - centreX);
			centreX          = (h0 + centreX) / this.scale;
			centreY          = (v0 + centreY) / this.scale;
			this.context.beginPath();
			this.context.arc(centreX, centreY, radius, startAngle, endAngle, true);
			this.context.stroke();
		}

		else{
			this.context.beginPath();
			this.context.moveTo(h0 / this.scale, v0 / this.scale);
			this.context.lineTo((endX + h0) / this.scale, (endY + v0) / this.scale);
			this.context.stroke();
		}
		
		this.x += (h1 + h2) / this.scale;
		this.y += (v1 + v2) / this.scale;
	}
	
	
	drawCircle(diameter, filled = false){
		const radius = (diameter / this.scale) / 2;
		this.context.beginPath();
		this.context.ellipse(this.x + radius, this.y, radius, radius, 0, 0, 2 * Math.PI);
		this.x += radius * 2;
		filled
			? this.fill()
			: this.context.stroke();
	}
	
	
	drawEllipse(args, filled = false){
		const radiusX = (args[0] / this.scale) / 2;
		const radiusY = (args[1] / this.scale) / 2;
		this.context.beginPath();
		this.context.ellipse(this.x + radiusX, this.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
		this.x += radiusX * 2;
		filled
			? this.fill()
			: this.context.stroke();
	}
	
	
	drawLine(args){
		this.context.moveTo(this.x, this.y);
		this.x += +args[0] / this.scale;
		this.y += +args[1] / this.scale;
		this.context.lineTo(this.x, this.y);
		this.context.stroke();
	}
	
	
	drawPolygon(args, filled = false){
		this.context.beginPath();
		this.context.moveTo(this.x, this.y);
		let tmpX = this.x;
		let tmpY = this.y;
		let endX = 0;
		let endY = 0;
		const {length} = args;
		for(let i = 0; i < length; i += 2){
			const lineX = args[i]   / this.scale;
			const lineY = args[i+1] / this.scale;
			endX += lineX;
			endY += lineY;
			tmpX = tmpX + lineX;
			tmpY = tmpY + lineY;
			this.context.lineTo(tmpX, tmpY);
		}
		this.x += endX;
		this.y += endY;
		this.context.closePath();
		filled
			? this.fill()
			: this.context.stroke();
	}
	
	
	drawSpline(args){
		this.context.beginPath();
		this.context.moveTo(this.x, this.y);
		this.context.lineTo(
			this.x += (args[0] / 2) / this.scale,
			this.y += (args[1] / 2) / this.scale
		);
		const tNum = 2;
		const tDen = 3;
		const numPoints = args.length - 2;
		for(let i = 0; i < numPoints; i += 2){
			const nX = ((args[i]   - args[i]   / 2) + args[i+2] / 2) / this.scale;
			const nY = ((args[i+1] - args[i+1] / 2) + args[i+3] / 2) / this.scale;
			this.context.bezierCurveTo(
				this.x + ((args[i]   * tNum) / (2 * tDen)) / this.scale,
				this.y + ((args[i+1] * tNum) / (2 * tDen)) / this.scale,
				this.x + (args[i]   / 2 + (args[i+2] * (tDen - tNum)) / (2 * tDen)) / this.scale,
				this.y + (args[i+1] / 2 + (args[i+3] * (tDen - tNum)) / (2 * tDen)) / this.scale,
				this.x + nX,
				this.y + nY
			);
			this.x += nX;
			this.y += nY;
		}
		this.x += (args[numPoints]     - args[numPoints]     / 2) / this.scale;
		this.y += (args[numPoints + 1] - args[numPoints + 1] / 2) / this.scale;
		this.context.lineTo(this.x, this.y);
		this.context.stroke();
	}
	
	
	fill(){
		this.context.fillStyle = this.drawColour;
		this.context.fill();
		this.context.fillStyle = this.colour;
	}
	
	
	handleDeviceControl(ctrl, ...args){
		switch(ctrl[0]){
			// Source filename
			case "F":
				this.sourceFile = args.join(" ");
				break;
			
			// Mount font
			case "f":
				this.mountFont(...args);
				break;
			
			// Character height
			case "H":
				this.charHeight = +args[0] / this.scale;
				if(this.charSize === this.charHeight)
					this.charHeight = 0;
				this.updateTransformMatrix();
				break;
			
			// Output resolution
			case "r":
				this.res[0] = +args[0] || 0;
				this.res[1] = +args[1] || 0;
				this.res[2] = +args[2] || 0;
				break;
			
			// Slant
			case "S":
				this.slant = +args[0] || 0;
				this.updateTransformMatrix();
				break;
			
			// Device-specific
			case "X":
				this.handleExtendedDeviceControl(...args);
				break;
		}
	}
	
	
	handleDrawingCommand(type, ...args){
		switch(type[0]){
			case "~": this.drawSpline(args);          break;
			case "a": this.drawArc(args);             break;
			case "c": this.drawCircle(args[0]);       break;
			case "C": this.drawCircle(args[0], true); break;
			case "e": this.drawEllipse(args);         break;
			case "E": this.drawEllipse(args, true);   break;
			case "l": this.drawLine(args);            break;
			case "p": this.drawPolygon(args);         break;
			case "P": this.drawPolygon(args, true);   break;
			case "t": this.setLineThickness(args[0]); break;
			
			// Drawing colour
			case "F":
				if(type.length > 1)
					args.unshift(type.substr(1));
				const [mode, ...values] = args;
				this.drawColour = this.parseColour(mode, values);
				break;
			
			// Drawing colour (legacy)
			case "f":
				this.drawColour = (args[0] < 0 || args[0] > 1000)
					? this.context.fillStyle
					: this.parseColour("G", args);
				break;
		}
	}
	
	
	handleExtendedDeviceControl(name, ...args){
		let unknownCommand = false;
		switch(name){
			// PostScript commands
			case "ps:":
				switch(args[0]){
					
					// Output suppression
					case "invis":     this.invisible = true;  break;
					case "endinvis":  this.invisible = false; break;
					
					// Execute PostScript code
					case "exec":
						const code = args.join(" ");
						
						// Set rotation
						if(/exec gsave currentpoint 2 copy translate .+ rotate neg exch neg exch translate/.test(code))
							this.setRotation(args[6]);
						
						// Unset rotation
						else if("grestore" === args[1])
							this.setRotation(0);
						
						// Set stroke properties
						else if(/exec \d setline(cap|join)/.test(code))
							"cap" === RegExp.lastParen
								? (this.context.lineCap  = ["butt", "round", "square"][args[1]])
								: (this.context.lineJoin = ["miter", "round", "bevel"][args[1]]);
						
						// Unknown/non-graphical command
						else unknownCommand = true;
						break;
					default:
						unknownCommand = true;
				}
				break;
			
			// gropdf-specific
			case "pdf:":
				switch(args[0]){
					
					// "Hotspot" regions
					case "markstart":   this.hotspotStart(args);  break;
					case "markend":     this.hotspotEnd();        break;
					case "marksuspend": this.hotspotHold = true;  break;
					case "markrestart": this.hotspotHold = false; break;
					
					// Reverse letters
					case "xrev":
						this.reversed = !this.reversed;
						this.updateTransformMatrix();
						break;
					
					default:
						unknownCommand = true;
				}
				break;
			
			// Unrecognised
			default:
				unknownCommand = true;
		}
		
		if(unknownCommand)
			this.devCmds.push({x: this.x, y: this.y, name, args});
	}
	
	
	informEOL(){
		if(null !== this.hotspot){
			this.hotspotEnd();
			this.hotspotWrap = true;
		}
	}
	
	
	hotspotStart(args){
		this.hotspot = this.parseHotspot(args);
	}
	
	
	hotspotEnd(){
		if(null !== this.hotspot && !this.hotspotHold){
			this.hotspot.width = (this.x - this.hotspot.x) + this.hotspot.lead;
			this.hotspots.push(this.hotspot);
			this.hotspot = null;
		}
	}
	
	
	mountFont(position, name){
		const fontData = this.fontStyles[name];
		
		// No matching style strings for this font
		if(!fontData){
			console.warn(`Unrecognised font "${name}" will be rendered as sans-serif`);
			return ["", "px sans-serif"];
		}
		
		const family = fontData[0];
		const style  = fontData.slice(1).reverse().join(" ");
		this.fonts[position] = [style ? style + " " : "", `px ${family}`];
		this.fonts[position].name = name;
	}
	
	
	moveByX(value){
		this.x += +value / this.scale;
	}
	
	
	moveByY(value){
		this.y += +value / this.scale;
	}
	
	
	moveToX(value){
		this.x = +value / this.scale;
	}
	
	
	moveToY(value){
		this.y = +value / this.scale;
	}
	
	
	moveThenPrint(offset, text){
		this.x += Math.floor(+offset / this.res[1]) / this.scale;
		this.print(text);
	}
	
	
	parseColour(scheme, data){
		switch(scheme[0]){
			// CMY
			case "c":
				data = data.map(a => (1 - Math.round(a / 65536)) * 255);
				return `rgb(${ data.join() })`;
			
			// CMYK
			case "k":
				const [c, m, y, k] = data.map(a => Math.round(a / 65536));
				data = [
					255 * (1 - c) * (1 - k),
					255 * (1 - m) * (1 - k),
					255 * (1 - y) * (1 - k),
				];
				return `rgb(${ data.join() })`;
			
			// RGB
			case "r":
				data = data.map(a => Math.round(a / 257));
				return `rgb(${ data.join() })`;

			/** FIXME: Look into this and decide if the fall-through
			is deliberate (and if so, WHY?!) */
			// Greyscale
			case "G": // Legacy `Df` command
				data = [Math.round((1 - data[0] / 1000) * 65536)];
			case "g":
				data = new Array(3).fill(Math.round(data[0] / 257));
				return `rgb(${ data.join() })`;
			
			default: return "#000";
		}
	}
	
	
	parseHotspot(args){
		const rst     = (+args[1] + +args[3]) / this.scale;
		const rsb     = (+args[2] - +args[3]) / this.scale;
		const lead    =  +args[3] / this.scale;
		const x       =  this.x - lead;
		const y       =  this.y - rst;
		const height  = (this.y - rsb) - (this.y - rst);
		const hotspot = new Hotspot(x, y, 0, height, lead, args);
		hotspot.parseExtraArgs(args.slice(4).join(" "));
		return hotspot;
	}
	
	
	parseLength(input){
		const value = input.substr(0, input.length - 1);
		const unit  = input.substr(-1);
		switch(unit){
			case "i": return parseInt(value * 72);         // Inches
			case "c": return parseInt(value * 72 / 2.54);  // Centimetres
			case "m": return parseInt(value * 72 / 25.4);  // Millimetres
			case "p": return +value;                       // Points
			case "P": return value * 6;                    // Picas
			case "z": return value / this.unitWidth;       // Scaled units
			default:  return NaN;
		}
	}
	
	
	print(text){
		text = this.remapChars(text);
		this.context.save();
		if(null !== this.tm){
			if(this.reversed){
				text = text.split("").reverse().join("");
				const {width} = this.context.measureText(text);
				this.context.translate(width, 0);
			}
			this.context.translate(this.x, this.y);
			this.context.transform(...this.tm);
			this.context.translate(-this.x, -this.y);
		}
		this.context.fillText(text, this.x, this.y);
		this.context.restore();
		if(true === this.hotspotWrap && !this.hotspotHold){
			const lastHotspot = this.hotspots[this.hotspots.length - 1];
			lastHotspot && this.hotspotStart(lastHotspot.rawArgs);
			this.hotspotWrap = false;
		}
	}
	
	
	printChar(text){
		this.print(text);
	}
	
	
	printText(data){
		this.print(data);
		this.x += this.context.measureText(data).width;
	}
	
	
	printTrackedText(spacing, text){
		spacing /= this.scale;
		for(const glyph of text.split("")){
			const {width} = this.context.measureText(glyph);
			this.print(glyph);
			this.x += width + spacing;
		}
	}
	
	
	remapChars(data){
		const map = this.charMaps[this.font ? this.font.name : "R"];
		if(map){
			let output = "";
			const {length} = data;
			for(let i = 0; i < length; ++i){
				const from = data[i];
				const to = map[from];
				output += to ? String.fromCharCode(to) : data;
			}
			return output;
		}
		else return data && this.fixQuotes
			? data.replace(/`/g, "\u{2018}").replace(/'/g, "\u{2019}")
			: data;
	}
	
	
	setColour(scheme, data){
		this.colour = this.parseColour(scheme, data);
		this.context.fillStyle = this.colour;
		this.context.strokeStyle = this.colour;
	}
	
	
	setFont(name){
		this.font = this.fonts[name];
		this.context.font = this.font[0] + this.charSize + this.font[1];
	}
	
	
	setLineThickness(value){
		let width = value / this.scale;
		if(width < 0)
			width = ((this.res[0] / (72 * this.sizeScale)) * 40 * this.charSize) / 1000;
		this.context.lineWidth = width;
		this.x += width;
	}
	
	
	setRotation(value){
		value = +value || 0;
		if(!value && this.rotated){
			this.context.restore();
			this.rotated = false;
		}
		else{
			this.context.save();
			this.context.resetTransform();
			this.context.translate(this.x, this.y);
			this.context.rotate(value * Math.PI / 180);
			this.context.translate(-this.x, -this.y);
			this.rotated = true;
		}
	}
	
	
	setSize(size){
		this.charSize = +size / this.scale;
		this.context.font = this.font[0] + this.charSize + this.font[1];
		if(this.lineWidth < 1){
			const width = ((this.res[0] / (72 * this.sizeScale)) * 40 * this.charSize) / 1000;
			this.context.lineWidth = width;
			this.x += width;
		}
	}
	
	
	updateTransformMatrix(){
		if(!this.reversed && 0 === this.slant && 0 === this.charHeight)
			this.tm = null;
		else{
			this.tm = [1,0,0,1,0,0];
			const {charHeight, charSize, slant, tm} = this;
			if(0 !== charHeight)
				tm[3] = charHeight / charSize;
			if(0 !== slant){
				let angle = -slant;
				if(0 !== charHeight)
					angle *= charHeight / charSize;
				angle = angle * Math.PI / 180;
				tm[2] = Math.sin(angle) / Math.cos(angle);
			}
			if(this.reversed)
				tm[0] = -tm[0];
		}
	}
}


class Hotspot{
	
	constructor(x, y, width, height, lead = 0, rawArgs = null){
		this.x      = x;
		this.y      = y;
		this.width  = width;
		this.height = height;
		this.lead   = lead;
		this.border = {
			cornerRadiusH: 0,
			cornerRadiusV: 0,
			colour: [0, 0, 0],
			dashGaps: [],
			thickness: 0,
		};
		if(rawArgs)
			this.rawArgs = rawArgs;
	}
	
	
	draw(context){
		if(!this.border.thickness) return;
		context.save();
		context.lineCap = "butt";
		context.lineJoin = "miter";
		context.lineWidth = this.border.thickness;
		context.setLineDash(this.border.dashGaps);
		context.strokeStyle = "rgb(" + this.border.colour.join(", ") + ")";
		context.strokeRect(this.x, this.y, this.width, this.height);
		context.restore();
	}
	
	
	parseExtraArgs(args){
		args = args.replace(/\s*\/Border\s+\[([^[\]]+)\s*(?:\[([^\]]+)\]\s*)?\]/, (_, values, dash) => {
			values = values.trim().split(/\s+/);
			this.border.cornerRadiusH = +values[0] || 0;
			this.border.cornerRadiusV = +values[1] || 0;
			this.border.thickness     = +values[2] || 0;
			if(dash){
				dash = dash.trim().split(/\s+/).map(n => +n);
				this.border.dashGaps = dash;
			}
			return "";
		})
		.replace(/\s*\/Color\s*\[([^\]]+)\]/, (_, values) => {
			values = values.trim().split(/\s+/).map(n => Math.round(+n * 0xFF) || 0);
			this.border.colour = values;
			return "";
		})
		.replace(/\/Subtype\s+\/Link\s+(.+)/, (_, data) => {
			if(/^\/Dest\s+\/(\S+)\s*$/.test(data))
				this.targetDest = RegExp.lastParen;
			else if(/^\s*\/Action\s+<<\s*\/Subtype\s+\/URI/.test(data))
				this.targetURI = data.match(/\/URI\s+\((\S*)\)\s+>>/)[1];
			return "";
		})
		.trim();
		
		// Store anything we didn't expect to find
		if(args) this.unparsedArgs = args;
	}
}

Hotspot.prototype.rawArgs = null;
Hotspot.prototype.unparsedArgs = "";
