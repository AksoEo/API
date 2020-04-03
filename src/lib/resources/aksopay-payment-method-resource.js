import SimpleResource from './simple-resource';

/**
 * A resource representing an AKSOPay PaymentMethod
 */
class AKSOPayPaymentMethodResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		const fields = req.query.fields || schema.defaultFields;

		if (obj.type !== 'stripe') {
			delete obj.stripeMethods;
			delete obj.stripePublishableKey;
		}

		if ('stripeMethods' in obj) {
			obj.stripeMethods = obj.stripeMethods.split(',');
		}
		if ('currencies' in obj) {
			obj.currencies = obj.currencies.split(',');
		}
		if ('isRecommended' in obj) {
			obj.isRecommended = !!obj.isRecommended;
		}

		this.removeUnnecessary(fields);
	}
}

export default AKSOPayPaymentMethodResource;
