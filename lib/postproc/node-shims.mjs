/**
 * @file Wrappers for features specific to Node.js or Electron.
 */

/**
 * Are we running in a Node.js-like environment?
 * @const {Boolean} isNode
 */
export const isNode = "object" === typeof process
	&& "object"   === typeof global
	&& "object"   === typeof module
	&& "object"   === typeof module.exports
	&& "function" === typeof global.require
	&& "object"   === typeof process.versions
	&& process.versions.node;

/**
 * Does this appear to be an Electron app?
 * @const {Boolean} isElectron
 */
export const isElectron = isNode && process.versions.electron;

/**
 * Asynchronously load the contents of a file.
 * @param {String|URL} path
 */
export const readFile = async path => {
	
	// Node.js/Electron
	if(isNode){
		const {readFile} = await import("fs");
		return new Promise((resolve, reject) => {
			readFile(path, "utf8", (error, data) =>
				error ? reject(error) : resolve(data));
		});
	}
	
	// Modern browser
	else if("function" === typeof window.fetch)
		return (await fetch(path)).text();
	
	// Ancient browser, probably running transpiled ES5 source
	else return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", path);
		xhr.onreadystatechange = () => {
			if(4 !== xhr.readyState) return;
			xhr.status < 400
				? resolve(xhr.responseText)
				: reject(new Error(`HTTP 1.1/${xhr.status} ${xhr.statusText}`));
		};
		xhr.onerror = reject;
		xhr.send();
	});
};


/**
 * Methods external to the browser or Node instance.
 * @type {Object}
 */
export const shell = {
	openExternal: async uri => {
		if(isElectron){
			const {openExternal} = await import("shell");
			return openExternal(uri);
		}
	},
};
