/**
 * A simple resource
 */
class SimpleResource {
	constructor (obj) {
		if (obj === undefined) {
			throw new Error('SimpleResource cannot be undefined');
		}

		delete obj._relevance;
		this.obj = obj;
	}

	/**
	 * Removes fields that weren't selected from the resource
	 * @param {express.Request} req
	 * @param {string[]}        [except] An array of fields not to remove regardless
	 */
	removeUnnecessary (req, except = []) {
		for (let key of Object.keys(this.obj)) {
			if (req.query.fields.indexOf(key) === -1 && except.indexOf(key) === -1) {
				delete this.obj[key];
			}
		}
	}

	toJSON () {
		return this.obj;
	}
}

export default SimpleResource;
