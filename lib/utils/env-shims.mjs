/**
 * @file Wrappers for environment-specific features.
 */

/**
 * Are we running in a Node.js-like environment?
 * @const {Boolean} isNode
 */
const isNode =
	!!("object" === typeof process
	&& "object" === typeof global
	&& "object" === typeof process.versions
	&& "string" === typeof process.versions.node);

/**
 * Does this appear to be an Electron app?
 * @const {Boolean} isElectron
 */
const isElectron = !!(isNode && process.versions.electron);


/**
 * Asynchronously load the contents of a file.
 * @param {String|URL} path
 * @param {Boolean} [raw=false]
 * @return {String|ArrayBuffer}
 */
export async function readFile(path, raw = false){
	
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
}


/**
 * Resolve the absolute path of a file relative to package's entry-point.
 * @param {String} path
 * @return {String}
 */
export async function resolvePath(path){
	const url = import.meta.url
		.replace(/\/utils\/env-shims\.mjs$/i, "")
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
}
let anchorHack = null;


/**
 * Select and load files from the user's filesystem.
 * @param {Boolean} [multiple=false]
 * @param {String|String[]} [fileExts=null]
 * @return {LoadedFile[]}
 */
export async function selectFile(multiple = false, fileExts = null){
	fileExts = fileExts && ("string" === typeof fileExts
		? fileExts.trim().split(/\s+/)
		: [...fileExts]).map(e => e.replace(/^\*?\.|,/g, ""));
	
	// Electron
	if(isElectron){
		const {dialog, remote} = await import("electron");
		const options = {properties: ["openFile", "showHiddenFiles"]};
		if(multiple) options.properties.push("multiSelections");
		if(fileExts) options.filters = fileExts.map(e => ({extensions: [e]}));
		return Promise.all(((dialog || remote.dialog).showOpenDialog(options) || [])
			.map(path => readFile(path, true).then(data => ({path, data}))));
	}
	
	// Browsers
	else{
		if(!fileInput){
			fileInput = document.createElement("input");
			fileInput.type = "file";
		}
		fileInput.multiple = !!multiple;
		fileInput.accept = fileExts ? fileExts.map(e => "." + e).join(",") : "";
		const files = await new Promise(resolve => {
			fileInput.onchange = () => resolve([...fileInput.files]);
			fileInput.click();
		});
		fileInput.onchange = null;
		fileInput.value = "";
		return Promise.all(files.map(file => new Promise((resolve, reject) => {
			const reader   = new FileReader();
			reader.onabort = () => resolve();
			reader.onerror = () => reject(reader.error);
			reader.onload  = () => resolve({
				data: new Uint8Array(reader.result),
				path: file.name,
			});
			reader.readAsArrayBuffer(file);
		})));
	}
	/**
	 * @typedef  {Object} LoadedFile
	 * @property {String} path
	 * @property {Uint8Array} data
	 */
}
let fileInput = null;


/**
 * Open a file or URL externally.
 * @param {String} uri
 * @return {void}
 */
export const openExternal = uri => isElectron
	? void require("shell").openExternal(uri)
	: window.open(uri);
