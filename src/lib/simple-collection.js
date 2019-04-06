import SimpleResource from './simple-resource';

class SimpleCollection {
	constructor (arr) {
		this.arr = arr.map(x => new SimpleResource(x));
	}

	toJSON () {
		return this.arr;
	}
}

export default SimpleCollection;
