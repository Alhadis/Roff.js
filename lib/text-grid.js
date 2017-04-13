"use strict";

class TextGrid{
	
	constructor(){
		const data = [[]];
		let x      = 0;
		let y      = 0;
		let rows   = 0;
		let cols   = 0;
		
		Object.defineProperties(this, {
			charAbove: {
				get: () => 0 === y ? "" : data[y - 1][x],
				set: to => {
					if(0 !== y)
						data[y - 1][x] = to;
				}
			},
			charBelow: {
				get: () => y < rows - 1 ? data[y + 1][x] : "",
				set: to => {
					if(y === rows - 1)
						++this.rows;
					data[y + 1][x] = to;
				}
			},
			charBefore: {
				get: () => 0 === x ? "" : data[y][x - 1],
				set: to => {
					if(0 !== x)
						this.data[y][x - 1] = to;
				}
			},
			charAfter: {
				get: () => x < cols ? data[y][x + 1] : "",
				set: to => {
					if(x === cols - 1)
						++this.cols;
					data[y][x + 1] = to;
				}
			},
			currentChar: {
				get: () => data[y][x] || "",
				set: to => data[y][x] = to
			},
			
			data: {
				get: () => data
			},
			
			rows: {
				get: () => rows,
				set: to => {
					to = Math.max(1, +to);
					if(to > rows)
						for(let i = rows; i < to; ++i)
							data.push(new Array(cols).fill(" "));
					else if(to < rows)
						rows.length = to;
					rows = to;
				}
			},
			
			cols: {
				get: () => cols,
				set: to => {
					to = Math.max(1, +to);
					if(to > cols)
						for(const row of data)
							for(let i = cols; i < to; ++i)
								row.push(" ");
					else if(to < cols)
						for(const row of data)
							row.length = to;
					cols = to;
				}
			},
			
			x: {
				get: () => x,
				set: to => {
					x = Math.max(0, to);
					if(x > cols)
						this.cols = x;
				}
			},
			
			y: {
				get: () => y,
				set: to => {
					y = Math.max(0, to);
					if(y > rows)
						this.rows = y;
				}
			},
			
			width: {
				get: () => this.cols,
				set: to => this.cols = to
			},
			
			height: {
				get: () => this.rows,
				set: to => this.rows = to
			},
		});
	}
	
	
	canJoinBottom(char){
		switch(char){
			case "│": case "┌": case "┐": case "├":
			case "┤": case "┬": case "┼":
				return true;
		}
		return false;
	}
	
	
	canJoinLeft(char){
		switch(char){
			case "─": case "┐": case "┘": case "┤":
			case "┬": case "┴": case "┼":
				return true;
		}
		return false;
	}
	
	
	canJoinRight(char){
		switch(char){
			case "─": case "┌": case "└": case "├":
			case "┬": case "┴": case "┼":
				return true;
		}
		return false;
	}
	
	
	canJoinTop(char){
		switch(char){
			case "│": case "└": case "┘": case "├":
			case "┤": case "┴": case "┼":
				return true;
		}
		return false;
	}
	
	
	drawLine(width, height = 0){
		width  = +width  || 0;
		height = +height || 0;
		const {x, y} = this;
		
		// Horizontal
		if(0 === height){
			let from = x;
			let to = Math.max(0, x + width);
			let endpoint = to;
			
			if(to > this.cols)
				this.cols = to;
			
			else if(width < 0){
				[to, from] = [from, to];
				endpoint = from;
			}
			
			for(let i = from; i < to; ++i){
				this.x = i;
				const {charAfter, charBefore, charAbove, charBelow, currentChar} = this;
				let char = "─";
				
				if(this.canJoinTop(currentChar) || this.canJoinBottom(currentChar)){
					const joinUp = this.canJoinBottom(charAbove);
					const joinDown = this.canJoinTop(charBelow);
					
					if(i === from){
						const joinLeft = this.canJoinRight(charBefore);
						if(joinUp){
							if(joinLeft && joinDown) char = "┼";
							else if(joinLeft)        char = "┴";
							else if(joinDown)        char = "├";
							else                     char = "└";
						}
						else{
							if(joinLeft && joinDown) char = "┬";
							else if(joinDown)        char = "┌";
						}
					}
					
					else if(i === to - 1){
						const joinRight = this.canJoinLeft(charAfter);
						if(joinUp){
							if(joinRight && joinDown) char = "┼";
							else if(joinRight)        char = "┴";
							else if(joinDown)         char = "┤";
							else                      char = "┘";
						}
						else{
							if(joinRight && joinDown) char = "┬";
							else if(joinDown)         char = "┐";
						}
					}
					else{
						if(joinUp && joinDown) char = "┼";
						else if(joinUp)        char = "┴";
						else if(joinDown)      char = "┬";
					}
				}
				
				this.data[y][i] = char;
			}
			return this.moveTo(endpoint, y);
		}
		
		// Vertical
		else{
			let from = y;
			let to = Math.max(0, y + height);
			let endpoint = to;
			
			if(to > this.rows)
				this.rows = to;
			
			else if(height < 0){
				[to, from] = [from, to];
				endpoint = from;
			}
			
			for(let i = from; i < to; ++i){
				this.y = i;
				const {charAfter, charBefore, charAbove, charBelow, currentChar} = this;
				let char = "│";
				
				if(this.canJoinLeft(currentChar) || this.canJoinRight(currentChar)){
					const joinLeft = this.canJoinRight(charBefore);
					const joinRight = this.canJoinLeft(charAfter);
					
					if(i === from){
						const joinTop = this.canJoinBottom(charAbove);
						if(joinLeft){
							if(joinTop && joinRight) char = "┼";
							else if(joinTop)         char = "┤";
							else if(joinRight)       char = "┬";
							else                     char = "┐";
						}
						else{
							if(joinTop && joinRight) char = "├";
							else if(joinRight)       char = "┌";
						}
					}
					
					else if(i === to - 1){
						const joinDown = this.canJoinTop(charBelow);
						if(joinLeft){
							if(joinRight && joinDown) char = "┼";
							else if(joinRight)        char = "┴";
							else if(joinDown)         char = "┤";
							else                      char = "┘";
						}
						else{
							if(joinRight && joinDown) char = "├";
							else if(joinRight)        char = "└";
						}
					}
					else{
						if(joinLeft && joinRight)   char = "┼";
						else if(joinLeft)           char = "┤";
						else if(joinRight)          char = "├";
					}
				}
				this.data[i][x] = char;
			}
			return this.moveTo(x, endpoint);
		}
	}
	
	
	draw(lines){
		for(const [w, h] of lines){
			if(0 !== h) (h < 0)
				? this.down().drawLine(0, h - 1)
				: this.drawLine(0, h + 1).up();
			else (w < 0)
				? this.right().drawLine(w - 1, 0)
				: this.drawLine(w + 1, 0).left();
		}
		return this;
	}
	
	
	moveBy(x, y){
		this.x += x;
		this.y += y;
		return this;
	}
	
	
	moveTo(x, y){
		this.x = x;
		this.y = y;
		return this;
	}
	
	
	left(cols = 1){
		this.x -= cols;
		return this;
	}
	
	right(cols = 1){
		this.x += cols;
		return this;
	}
	
	down(lines = 1){
		this.y += lines;
		return this;
	}
	
	up(lines = 1){
		this.y -= lines;
		return this;
	}
	
	
	toString(){
		return this.data.map(row => row.join("")).join("\n");
	}
	
	
	write(text){
		if(!text) return this;
		const {length} = text;
		for(let i = 0; i < length; ++i){
			const char = text[i];
			if("\n" === char){
				++this.y;
				this.x = 0;
			}
			else this.data[this.y][this.x++] = char;
		}
		return this;
	}
	
	
	writeln(text){
		return this.write(text + "\n");
	}
}


module.exports = TextGrid;
