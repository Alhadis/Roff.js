/**
 * @file Wrappers for features specific to Node.js or Electron.
 */

/**
 * Are we running in a Node.js-like environment?
 * @const {Boolean} isNode
 */
export const isNode =
	!!("object" === typeof process
	&& "object" === typeof global
	&& "object" === typeof process.versions
	&& "string" === typeof process.versions.node);

/**
 * Does this appear to be an Electron app?
 * @const {Boolean} isElectron
 */
export const isElectron = !!(isNode && process.versions.electron);

/**
 * Asynchronously load the contents of a file.
 * @param {String|URL} path
 * @param {Boolean} [raw=false]
 * @return {String|ArrayBuffer}
 */
export const readFile = async (path, raw = false) => {
	
	// Node.js/Electron
	if(isNode){
		const {readFile} = await import("fs");
		return new Promise((resolve, reject) => {
			readFile(path, raw ? null : "utf8", (error, data) =>
				error ? reject(error) : resolve(data));
		});
	}
	
	// Modern browser
	else if("function" === typeof window.fetch)
		return (await fetch(path))[raw ? "arrayBuffer" : "text"]();
	
	// Ancient browser, probably running transpiled ES5 source
	else return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", path);
		xhr.responseType = raw ? "arraybuffer" : "text";
		xhr.onreadystatechange = () => {
			if(4 !== xhr.readyState) return;
			xhr.status < 400
				? resolve(raw && "string" === typeof xhr.response
					? xhr.response.split("")
					: xhr.response)
				: reject(new Error(`HTTP 1.1/${xhr.status} ${xhr.statusText}`));
		};
		xhr.onerror = reject;
		xhr.send();
	});
};


/**
 * Resolve the absolute path of a file relative to package's entry-point.
 * @param {String} path
 * @return {String}
 */
export const resolvePath = async path => {
	const url = import.meta.url
		.replace(/\/postproc\/node-shims\.mjs$/i, "")
		.replace(/\/[^/]*\.m?js$/i, "");
	
	// Node.js/Electron
	if(isNode){
		const {URL} = await import("url");
		const {resolve} = await import("path");
		return resolve("string" === typeof __dirname
			? __dirname
			: new URL(url).pathname, path);
	}
	
	// Browsers: abuse `HTMLAnchorElement.prototype.href` for path resolution
	else{
		anchorHack = anchorHack || document.createElement("a");
		anchorHack.href = url + "/" + path;
		return anchorHack.href;
	}
};
let anchorHack = null;


/**
 * Methods external to the browser or Node instance.
 * @type {Object}
 */
export const shell = {
	openExternal: uri => {
		if(isElectron){
			const {openExternal} = require("shell");
			return openExternal(uri);
		}
	},
};
