import QueryUtil from 'akso/lib/query-util';
import AKSOPayPaymentIntentResource from 'akso/lib/resources/aksopay-payment-intent-resource';

import { schema as parSchema, afterQuery } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Obtain org
		const paymentIntent = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('*');
		if (!paymentIntent) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.read.' + paymentIntent.org)) {
			if (paymentIntent.paymentMethod.type !== 'intermediary' ||
			!req.hasPermission(`pay.payment_intents.intermediary.${paymentIntent.org}.${paymentIntent.intermediaryCountryCode}`)) {
				return res.sendStatus(403);
			}
		}

		const mayAccessSensitiveData = [];
		if (req.hasPermission('pay.payment_intents.sensitive_data.' + paymentIntent.org)) {
			mayAccessSensitiveData.push(paymentIntent.org);
		}

		const query = AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new AKSOPayPaymentIntentResource(row, req, parSchema, mayAccessSensitiveData);
		res.sendObj(obj);
	}
};
