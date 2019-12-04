import SimpleResource from './simple-resource';

/**
 * A resource representing an admin group
 */
class AdminGroupResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;

		if (fields.includes('memberRestrictions.filter') || fields.includes('memberRestrictions.fields')) {
			if (obj.filter === null) {
				obj.memberRestrictions = null;
			} else {
				obj.memberRestrictions = {};
				if (fields.includes('memberRestrictions.filter')) {
					obj.memberRestrictions.filter = obj.filter;
				}
				if (fields.includes('memberRestrictions.fields')) {
					obj.memberRestrictions.fields = obj.fields;
				}
			}
		}
		delete obj.filter;
		delete obj.fields;
	}
}

export default AdminGroupResource;
