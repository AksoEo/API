import moment from 'moment-timezone';

import SimpleResource from './simple-resource';

/**
 * A resource representing statistics
 */
class StatisticsResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('date' in obj) { obj.date = moment(obj.date).format('YYYY-MM-DD'); }
	}
}

export default StatisticsResource;
