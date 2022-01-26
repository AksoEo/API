import SimpleResource from './simple-resource';

/**
 * A resource representing an org list
 */
class OrgListResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;
		this.removeUnnecessary(fields);
	}
}

export default OrgListResource;
