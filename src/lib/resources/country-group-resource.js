import SimpleResource from './simple-resource';

/**
 * A resource representing a country group
 */
class CountryGroupResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		if (obj.countries === null) {
			obj.countries = [];
		}

		const fields = req.query.fields || schema.defaultFields;
		this.removeUnnecessary(fields);
	}
}

export default CountryGroupResource;
