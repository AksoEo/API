import SimpleResource from './simple-resource';

/**
 * A resource representing a congress instance location
 */
class CongressInstanceLocationResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);
		const fields = [...(req.query.fields || schema.defaultFields)];

		if (obj.ll) {
			obj.ll = [
				obj.ll.x,
				obj.ll.y
			];
		}

		const shouldHaveRating = fields.includes('rating.rating')
			|| fields.includes('rating.max')
			|| fields.includes('rating.type');
		if (obj.rating !== null) {
			obj.rating = {
				rating: parseFloat(obj.rating, 10),
				max: obj.rating_max,
				type: obj.rating_type
			};

			if (!shouldHaveRating) {
				delete obj.rating;
			} else {
				if (!fields.includes('rating.rating')) { delete obj.rating.rating; }
				if (!fields.includes('rating.max')) { delete obj.rating.max; }
				if (!fields.includes('rating.type')) { delete obj.rating.type; }
			}
		}
		if (shouldHaveRating) {
			fields.push('rating');
		}

		if (obj.type === 'external') {
			delete obj.externalLoc;
		} else if (obj.type === 'internal') {
			delete obj.address;
			delete obj.ll;
			delete obj.icon;
		}

		this.removeUnnecessary(fields);
	}
}

export default CongressInstanceLocationResource;
