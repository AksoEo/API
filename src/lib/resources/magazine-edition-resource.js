import moment from 'moment-timezone';

import SimpleResource from './simple-resource';

/**
 * A resource representing a magazine edition
 */
class MagazineEditionResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('date' in obj) { obj.date = moment(obj.date).format('Y-MM-DD'); }
	}
}

export default MagazineEditionResource;
