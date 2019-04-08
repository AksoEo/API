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

	toJSON () {
		return this.obj;
	}
}

export default SimpleResource;
