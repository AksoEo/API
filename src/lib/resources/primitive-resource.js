import SimpleResource from './simple-resource';

/**
 * A primitive value wrapped in a resource for QueryUtil compatibility. Picks the indicated column and returns only that
 */
class PrimitiveResource extends SimpleResource {
	constructor (obj, col) {
		super(obj);

		this.obj = obj[col];
	}
}

export default PrimitiveResource;
