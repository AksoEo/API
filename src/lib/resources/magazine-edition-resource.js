import moment from 'moment-timezone';

import SimpleResource from './simple-resource';

/**
 * A resource representing a magazine edition
 */
class MagazineEditionResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;

		if ('date' in obj) { obj.date = moment(obj.date).format('Y-MM-DD'); }

		this.removeUnnecessary(fields);
	}
}

export default MagazineEditionResource;
