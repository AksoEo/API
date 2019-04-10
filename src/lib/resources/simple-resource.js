/**
 * A simple resource
 */
class SimpleResource {
	constructor (obj) {
		if (obj === undefined) {
			const err = new TypeError('SimpleResource cannot be undefined');
			err.simpleResourceError = true;
			throw err;
		}

		delete obj._relevance;
		this.obj = obj;
	}

	/**
	 * Removes fields that weren't selected from the resource
	 * @param {string[]} [except] The fields not to remove
	 */
	removeUnnecessary (except = []) {
		for (let key of Object.keys(this.obj)) {
			if (except.indexOf(key) === -1) {
				delete this.obj[key];
			}
		}
	}

	toJSON () {
		return this.obj;
	}
}

export default SimpleResource;
