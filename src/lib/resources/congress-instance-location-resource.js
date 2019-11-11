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

		if ('rating' in obj) { obj.rating = parseFloat(obj.rating, 10); }

		if ('rating' in obj || 'rating_max' in obj || 'rating_type' in obj) {
			obj.rating = {
				rating: obj.rating,
				max: obj.rating_max,
				type: obj.rating_type
			};
		}
	}
}

export default CongressInstanceLocationResource;
