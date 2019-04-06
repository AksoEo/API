class SimpleResource {
	constructor (obj) {
		if (obj === undefined) {
			throw new Error('SimpleResource cannot be undefined');
		}

		this.obj = obj;
	}

	toJSON () {
		return this.obj;
	}
}

export default SimpleResource;
