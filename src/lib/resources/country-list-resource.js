import SimpleResource from './simple-resource';

/**
 * A resource representing a country org list
 */
class CountryListResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;
		this.removeUnnecessary(fields);
	}
}

export default CountryListResource;
