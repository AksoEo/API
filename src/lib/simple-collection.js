import SimpleResource from './resources/simple-resource';

/**
 * A simple REST collection
 */
class SimpleCollection {
	constructor (arr, Res = SimpleResource, passToRes = []) {
		this.arr = arr.map(x => new Res(x, ...passToRes));
	}

	toJSON () {
		return this.arr;
	}
}

export default SimpleCollection;
