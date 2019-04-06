class SimpleCollection {
	constructor (arr) {
		for (let row of arr) {
			delete row._relevance;
		}
		this.arr = arr;
	}

	toJSON () {
		return this.arr;
	}
}

export default SimpleCollection;
