import SimpleResource from './simple-resource';

/**
 * A resource representing a registration entry
 */
class RegistrationEntry extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;

		if ('fishyIsOkay' in obj) { obj.fishyIsOkay = !!obj.fishyIsOkay; }

		if (fields.includes('pendingIssue.what') || fields.includes('pendingIssue.where')) {
			fields.push('pendingIssue');
			obj.pendingIssue = {
				what: obj.pendingIssue_what,
				where: obj.pendingIssue_where
			};
		}

		this.removeUnnecessary(fields);
	}
}

export default RegistrationEntry;
