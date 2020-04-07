import QueryUtil from 'akso/lib/query-util';
import AKSOPayPaymentIntentResource from 'akso/lib/resources/aksopay-payment-intent-resource';

import { schema as parSchema } from '../schema';

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
		const orgData = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.read.' + orgData.org)) {
			return res.sendStatus(403);
		}

		const mayAccessSensitiveData = [];
		if (req.hasPermission('pay.payment_intents.sensitive_data.' + orgData.org)) {
			mayAccessSensitiveData.push(orgData.org);
		}

		const query = AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		const obj = new AKSOPayPaymentIntentResource(row, req, parSchema, mayAccessSensitiveData);
		res.sendObj(obj);
	}
};
