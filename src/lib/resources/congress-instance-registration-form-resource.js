import SimpleResource from './simple-resource';

/**
 * A resource representing a congress instance registration form
 */
class CongressInstanceRegistrationFormResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);
		const fields = [...(req.query.fields || schema.defaultFields)];

		if ('allowUse' in obj) { obj.allowUse = !!obj.allowUse; }
		if ('allowGuests' in obj) { obj.allowGuests = !!obj.allowGuests; }

		if ('price_currency' in obj || 'price_var' in obj || 'price_minUpfront' in obj) {
			if (obj.price_currency === null) {
				obj.price = null;
			} else {
				obj.price = {};
				if ('price_currency' in obj) { obj.price.currency = obj.price_currency; }
				if ('price_var' in obj) { obj.price.var = obj.price_var; }
				if ('price_minUpfront' in obj) { obj.price.minUpfront = obj.price_minUpfront; }
			}
		}

		this.removeUnnecessary(fields.concat([ 'price' ]));
	}
}

export default CongressInstanceRegistrationFormResource;
