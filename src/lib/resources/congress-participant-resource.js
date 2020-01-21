import moment from 'moment-timezone';

import SimpleResource from './simple-resource';

/**
 * A resource representing a congress instance participant
 */
class CongressParticipantResource extends SimpleResource {
	constructor (obj, formFieldsObj) {
		super(obj);

		obj.data = {};
		for (const [key, rawVal] of Object.entries(obj)) {
			if (key === 'data') { continue; }
			const bits = key.split('.');
			if (bits[0] !== 'data') { continue; }

			let parsedVal;
			const type = formFieldsObj[bits[1]];
			if (type === 'boolean') { parsedVal = !!rawVal; }
			else if (type === 'date') {
				parsedVal = moment(rawVal).format('Y-MM-DD');
			} else if (type === 'time') {
				parsedVal = rawVal.split(':').slice(0, 2).join(':');
			} else { parsedVal = rawVal; }

			obj.data[bits[1]] = parsedVal;
			delete obj[key];
		}
		if (!obj.data.length) { delete obj.data; }

		if ('approved' in obj) { obj.approved = !!obj.approved; }
	}
}

export default CongressParticipantResource;
