import moment from 'moment-timezone';

import SimpleResource from './simple-resource';

/**
 * A resource representing a congress instance participant
 */
class CongressParticipantResource extends SimpleResource {
	constructor (obj, req, schema, formFieldsObj) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;

		obj.data = {};
		for (const [key, rawVal] of Object.entries(obj)) {
			if (key === 'data') { continue; }
			const bits = key.split('.');
			if (bits[0] !== 'data') { continue; }

			let parsedVal = rawVal;
			if (rawVal !== null) {
				const type = formFieldsObj[bits[1]];
				if (type === 'boolean') { parsedVal = !!rawVal; }
				else if (type === 'date') {
					parsedVal = moment(rawVal).format('Y-MM-DD');
				} else if (type === 'time') {
					parsedVal = rawVal.split(':').slice(0, 2).join(':');
				} else { parsedVal = rawVal; }
			}

			obj.data[bits[1]] = parsedVal;
			delete obj[key];
		}
		if (!Object.keys(obj.data).length) { delete obj.data; }

		obj.approved = !!obj.approved;

		obj.amountPaid = parseInt(obj.amountPaid, 10);

		delete obj.price_minUpfront;
		delete obj.manualApproval;
		if (!fields.includes('dataId')) { delete obj.dataId; }
		if (!fields.includes('approved')) { delete obj.approved; }
		if (!fields.includes('amountPaid')) { delete obj.amountPaid; }
		if (!fields.includes('hasPaidMinimum')) { delete obj.hasPaidMinimum; }
		if (!fields.includes('price')) { delete obj.price; }
		if (!fields.includes('cancelledTime')) { delete obj.cancelledTime; }
	}
}

export default CongressParticipantResource;
