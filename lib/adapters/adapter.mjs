import {which} from "./utils.mjs";


/**
 * Abstract base class for an external program driver.
 * @abstract
 * @class
 */
export default class Adapter {
	
	/**
	 * Handle basic initialisation common to all subclasses.
	 * @param {String} path
	 * @constructor
	 */
	constructor(path){
		if(!path && !this.constructor.allowMissing){
			const reason = "Cannot initialise without executable path";
			throw new TypeError(`[${this.constructor.name}::constructor] ${reason}`);
		}
		
		// Initialise properties
		this.path  = String(path || "");
		this.error = null;
		this.ready = false;
	}
	
	
	/**
	 * Handle any tasks which need to run before the instance can be used.
	 * @param {Function} [handler=null]
	 * @return {Adapter} Resolves with a reference to the calling instance.
	 * @internal
	 */
	async resolve(handler = null){
		if(this.resolvePromise)
			return this.resolvePromise;
		return this.resolvePromise = Promise.resolve().then(async () => {
			handler && await handler.call(this);
			this.ready = true;
			return this;
		}).catch(e => this.error = e);
	}
	

	/**
	 * Name of the physical executable. Deduced from the subclass name by default.
	 * @property {String} programName
	 * @readonly
	 */
	static get programName(){
		return this.name.replace(/Adapter$/i, "").toLowerCase();
	}
	
	
	/**
	 * Whether an instance may be created without an executable path.
	 *
	 * By default, paths are required and a {@link TypeError} will be thrown when
	 * initialising an adapter without one. Override this if the subclass is able
	 * to function without the binary being available.
	 *
	 * @property {Boolean} [allowMissing=false]
	 * @readonly
	 */
	static get allowMissing(){
		return false;
	}
	

	/**
	 * Locate the first executable in the system's PATH which matches the
	 * adapter subject's name, then initialise an instance with it.
	 *
	 * NOTE: Results are cached; to force a new lookup, unset the class's
	 * `resolvePromise` property before calling the method again. This is
	 * generally necessary if the contents of the PATH variable have been
	 * modified, or if executables have been added/removed since the last
	 * method call.
	 *
	 * @public
	 * @example <caption>Locate the host system's "foo" program</caption>
	 *    class FooAdapter extends Adapter {}
	 *    const foo = await FooAdapter.resolve();
	 *    foo.path == "/usr/bin/foo";
	 *    (foo === await FooAdapter.resolve()) == true;
	 *
	 * @return {Adapter|null}
	 *    Resolves with an instance of the calling class if the program
	 *    was found in the user's PATH; otherwise, resolves with `null`.
	 */
	static async resolve(){
		if(this.resolvePromise)
			return this.resolvePromise;
		
		// Bail if the subclass's target program is unknown or unclear
		const {programName} = this;
		if(!programName){
			const reason = "Invalid or undefined `programName` property";
			throw new TypeError(`[Adapter.resolve] ${reason}`);
		}
		
		return this.resolvePromise = which(programName).then(path =>
			path ? new this(path) : null);
	}
}
