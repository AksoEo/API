import SimpleResource from './simple-resource';

/**
 * A resource representing a congress instance location
 */
class CongressInstanceLocationResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if (obj.ll) {
			obj.ll = [
				obj.ll.x,
				obj.ll.y
			];
		}

		if (obj.rating) { obj.rating = parseFloat(obj.rating, 10); }
	}
}

export default CongressInstanceLocationResource;
