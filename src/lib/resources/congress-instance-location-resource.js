import SimpleResource from './simple-resource';

/**
 * A resource representing a congress instance location
 */
class CongressInstanceLocationResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		if (obj.ll) {
			obj.ll = [
				obj.ll.x,
				obj.ll.y
			];
		}

		if ('rating' in obj) { obj.rating = parseFloat(obj.rating, 10); }

		if (obj.rating !== null && obj.rating_max !== null && obj.rating_type !== null) {
			obj.rating = {
				rating: obj.rating,
				max: obj.rating_max,
				type: obj.rating_type
			};
		} else {
			delete obj.rating;
		}
		delete obj.rating_max;
		delete obj.rating_type;

		if (obj.type === 'external') {
			delete obj.externalLoc;
		} else if (obj.type === 'internal') {
			delete obj.address;
			delete obj.ll;
			delete obj.icon;
		}

		const fields = req.query.fields || schema.defaultFields;
		if (!fields.includes('type')) {
			delete obj.type;
		}
	}
}

export default CongressInstanceLocationResource;
