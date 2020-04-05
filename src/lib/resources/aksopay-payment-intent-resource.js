import SimpleResource from './simple-resource';

/**
 * A resource representing an AKSOPay PaymentIntent
 */
class AKSOPayPaymentIntentResource extends SimpleResource {
	constructor (obj, req, schema, mayAccessSensitiveData) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;

		if (fields.includes('customer.email') || fields.includes('customer.name')) {
			obj.customer = {};
			if (fields.includes('customer.email')) { obj.customer.email = obj.customer_email; }
			if (fields.includes('customer.name')) { obj.customer.name = obj.customer_name; }
		}
		if (fields.includes('stripeClientSecret') && !mayAccessSensitiveData.includes(obj.org)) {
			obj.stripeClientSecret === null;
		}

		this.removeUnnecessary(fields.concat(['customer']));
	}
}

export default AKSOPayPaymentIntentResource;
