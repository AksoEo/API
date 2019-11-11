import moment from 'moment-timezone';

import SimpleResource from './simple-resource';

/**
 * A resource representing a congress instance
 */
class CongressInstanceResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('dateFrom' in obj) { obj.dateFrom = moment(obj.dateFrom).format('Y-MM-DD'); }
		if ('dateTo' in obj) { obj.dateTo = moment(obj.dateTo).format('Y-MM-DD'); }
		
		if (obj.locationCoords) {
			obj.locationCoords = [
				obj.locationCoords.x,
				obj.locationCoords.y
			];
		}
	}
}

export default CongressInstanceResource;
