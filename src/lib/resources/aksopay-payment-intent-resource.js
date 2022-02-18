import SimpleResource from './simple-resource';

/**
 * A resource representing an AKSOPay PaymentIntent
 */
class AKSOPayPaymentIntentResource extends SimpleResource {
	constructor (obj, req, schema, mayAccessSensitiveData = []) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;

		if (fields.includes('customer.email') || fields.includes('customer.name')) {
			obj.customer = {};
			if (fields.includes('customer.email')) { obj.customer.email = obj.customer_email; }
			if (fields.includes('customer.name')) { obj.customer.name = obj.customer_name; }
		}
		if (fields.includes('stripeClientSecret') && !mayAccessSensitiveData.includes(obj.org)) {
			obj.stripeClientSecret = null;
		}
		if (fields.includes('intermediaryIdentifier.number') || fields.includes('intermediaryIdentifier.year')) {
			obj.intermediaryIdentifier = {};
			if (fields.includes('intermediaryIdentifier.number')) {
				obj.intermediaryIdentifier.number = obj.intermediaryIdentifier_number;
			}
			if (fields.includes('intermediaryIdentifier.year')) {
				obj.intermediaryIdentifier.year = obj.intermediaryIdentifier_year;
			}
		}

		this.removeUnnecessary(fields.concat(['customer', 'intermediaryIdentifier']));
	}
}

export default AKSOPayPaymentIntentResource;
