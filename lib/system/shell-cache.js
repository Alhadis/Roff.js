"use strict";

const {open, readFile} = require("fs");
const {exec, spawn}    = require("child_process");


/**
 * Convenience interface that performs asynchronous disk or shell
 * operations, then caches the results locally for quicker lookup.
 *
 * @property {Map} cachedOutput - Cached output of spawned shell-commands
 * @property {Map} cachedHashes - "Hashed" paths of programs in the user's $PATH
 * @property {Map} cachedFiles  - Files with content loaded by {@link fs.readFile}
 * @property {Map} cachedURLs   - Results of loading remote resources (HTTP/HTTPS)
 * @class
 */
class ShellCache{
	
	/**
	 * Construct a fresh instance with empty cache-maps.
	 *
	 * @param {Boolean} [noFreeze=false]
	 * @constructor
	 */
	constructor(noFreeze = false){
		this.cachedOutput = new Map();
		this.cachedHashes = new Map();
		this.cachedFiles  = new Map();
		this.cachedURLs   = new Map();
		this.chain        = this.chain.bind(this);
		this.exec         = this.exec.bind(this);
		this.which        = this.which.bind(this);
		this.loadFile     = this.loadFile.bind(this);
		this.loadURL      = this.loadURL.bind(this);
		noFreeze || Object.freeze(this);
	}


	/**
	 * Iterate through each cache property.
	 * @return {Iterable}
	 */
	[Symbol.iterator](){
		let index = 0;
		return [
			this.cachedOutput,
			this.cachedHashes,
			this.cachedFiles,
			this.cachedURLs,
		][index++] || {done: true};
	}


	/**
	 * Total number of cached entries stored in the instance.
	 * @property {Number}
	 * @readonly
	 */
	get size(){
		let total = 0;
		for(const cache of this){
			total += cache.size;
			for(const [key, value] of cache)
				if(value instanceof Map
				|| value instanceof Set)
					total += value.size;
		}
		return total;
	}


	/**
	 * Flush all cached data stored in the instance.
	 *
	 * This is the same as calling each cache's `clear()` method,
	 * except that entries which are maps or sets are themselves
	 * cleared before removal.
	 *
	 * @return {ShellCache} Reference to the calling instance.
	 * @public
	 */
	clear(){
		for(const cache of this){
			for(const [key, value] of cache){
				if(value instanceof Map
				|| value instanceof Set)
					value.clear();
				cache.delete(key);
			}
			cache.clear();
		}
		return this;
	}


	/**
	 * Execute a chain of piped commands.
	 *
	 * Resolves to an object with `stdin` and `stdout` properties.
	 *
	 * @example chain([["ps", "ax"], ["grep", "ssh"]], stdin);
	 * @param {Array[]} commands - An array of command/argv pairs
	 * @param {String} [inputData] - Data piped to stdin
	 * @param {String} [outputPath] - File to write stdout to
	 * @return {Promise}
	 */
	async chain(commands, inputData = null, outputPath = ""){
		commands = commands.slice();
		let result = {};
		while(commands.length){
			const [cmd, ...argv] = commands.shift();
			const output = commands.length ? "" : outputPath;
			result = await this.exec(cmd, argv, inputData, output);
			inputData = result.stdout;
		}
		return result;
	}
	
	
	/**
	 * Execute an external command.
	 *
	 * @example exec("sed", ["-e", "s/in/out/"], "input");
	 * @param {String} cmd - Executed command
	 * @param {String[]} args - List of arguments/switches
	 * @param {String} [inputData] - Data piped to stdin
	 * @param {String} [outputPath] - File to write stdout to
	 * @param {String} [encoding="utf8"] - Character encoding
	 * @return {Promise} Resolves to an object
	 */
	async exec(cmd, args = [], inputData = null, outputPath = "", encoding = "utf8"){
		
		// Reuse the output of an earlier identical call
		const cacheKey = [cmd, ...args].join(" ");
		let cached;
		if((cached = this.cachedOutput.get(cacheKey))
		&& (cached = cached.get(inputData)) != null)
			return cached;

		// Throw a hissy-fit if the requested command isn't available
		let cmdPath = await this.which(cmd);
		if(!cmdPath)
			throw new ReferenceError(`No such command: ${cmd}`);
		
		const fd = await (outputPath && new Promise((resolve, reject) => {
			open(outputPath, "w", (error, result) => error
				? reject(error)
				: resolve(result));
			}));
		const stdio = outputPath
			? ["pipe", fd, "pipe"]
			: "pipe";
		const proc = spawn(cmdPath, args, {stdio});
		
		let stdout = "";
		let stderr = "";
		if(null !== inputData){
			proc.stdin.write(inputData, encoding);
			proc.stdin.end();
		}
		if(!outputPath){
			proc.stdout.setEncoding(encoding);
			proc.stdout.on("data", data => stdout += data);
		}
		proc.stderr.setEncoding(encoding);
		proc.stderr.on("data", data => stderr += data);
		const output = await new Promise((resolve, reject) => {
			proc.on("close", code => resolve({code, stdout, stderr}));
			proc.on("error", error => reject(error));
		});
		
		cached = this.cachedOutput.get(cacheKey);
		if(!cached)
			this.cachedOutput.set(cacheKey, cached = new Map());
		cached.set(inputData, output);
		return output;
	}
	

	/**
	 * Asynchronously read a file.
	 * 
	 * @param {String} path
	 * @param {String} [encoding="utf8"]
	 * @param {Boolean} [ignoreCache=false]
	 * @return {Promise}
	 */
	async loadFile(path, encoding = "utf8", ignoreCache = false){
		
		// Reuse cache if possible
		let data = "";
		if(!ignoreCache && null != (data = this.cachedFiles.get(path)))
			return data;
		
		data = (await new Promise((resolve, reject) => {
			readFile(path, {encoding}, (error, data) => error
				? reject(error)
				: resolve(data));
		})).toString();
		ignoreCache || this.cachedFiles.set(path, data);
		return data;
	}


	/**
	 * Asynchronously load a resource over HTTP or HTTPS.
	 *
	 * @example loadURL("https://example.com/");
	 * @param {String} url
	 * @param {String} [encoding="utf8"]
	 * @param {Boolean} [ignoreCache=false]
	 * @return {Promise}
	 */
	async loadURL(url, encoding = "utf8", ignoreCache = false){
		
		// Reuse cache if possible
		let data = "";
		if(!ignoreCache && null != (data = this.cachedURLs.get(url)))
			return data;
		
		// Determine protocol of resource (HTTPS or HTTP)
		const protocol = url.match(/^https?(?=:\/{2}\S)/i);
		if(!protocol)
			throw new URIError(`Expected HTTPS/HTTP URL, got: ${url}`);

		const {get} = require(protocol[0].toLowerCase());
		data = (await new Promise((resolve, reject) => {
			const request = get(url, response => {
				if(response.statusMessage !== "OK")
					return reject(response);
				encoding && response.setEncoding(encoding);
				response.on("data", s => data += s);
				response.on("end", () => resolve(data));
			});
			request.on("error", e => reject(e));
		})).toString();
		ignoreCache || this.cachedURLs.set(url, data);
		return data;
	}


	/**
	 * Locate the path(s) for an executable in the user's $PATH.
	 *
	 * Results are hashed (cached) for quicker lookup.
	 *
	 * @example which("curl") => "/usr/bin/curl"
	 * @param {String} name
	 * @param {Boolean} [ignoreCache=false]
	 * @return {Promise}
	 */
	async which(name, ignoreCache = false){
		if(!name) return "";

		let hashes;
		if(!ignoreCache && (hashes = this.cachedHashes.get(name)))
			return hashes[0] || "";

		const cmdStr = "win32" === process.platform
			? `@for %g in (ECHO ${name.replace(/%/g, "%%")}) do`
				+ " @for %e in (%PATHEXT%) do"
				+ " @for %i in (%g%e) do "
				+ ' @if NOT "%~$PATH:i"=="" echo %~$PATH:i'
			: `command -v '${name.replace(/'/g, `'"'"'`)}' 2>/dev/null`;
		
		hashes = await new Promise(resolve =>
			exec(cmdStr, {windowsHide: true}, (error, output) => error
				? resolve("")
				: resolve(output)));
		
		hashes = hashes.split(/\r?\n/).filter(Boolean);
		ignoreCache || this.cachedHashes.set(name, hashes);
		return hashes[0] || "";
	}
}

module.exports = ShellCache;
