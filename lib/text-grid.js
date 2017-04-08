"use strict";

class TextGrid{
	
	constructor(){
		const data = [[]];
		let x      = 0;
		let y      = 0;
		let rows   = 0;
		let cols   = 0;
		
		Object.defineProperties(this, {
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
					x = to;
					if(x > cols)
						this.cols = x;
				}
			},
			
			y: {
				get: () => y,
				set: to => {
					y = to;
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
	
	
	write(text){
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
	
	
	moveTo(x, y){
		this.x = x;
		this.y = y;
		return this;
	}
	
	
	toString(){
		return this.data.map(row => row.join("")).join("\n");
	}
}


module.exports = TextGrid;
