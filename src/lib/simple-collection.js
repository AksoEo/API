import SimpleResource from './resources/simple-resource';

/**
 * A simple REST collection
 */
class SimpleCollection {
	constructor (arr, Res = SimpleResource) {
		this.arr = arr.map(x => new Res(x));
	}

	toJSON () {
		return this.arr;
	}
}

export default SimpleCollection;
