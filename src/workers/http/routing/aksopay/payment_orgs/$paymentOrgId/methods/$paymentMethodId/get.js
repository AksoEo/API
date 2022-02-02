import QueryUtil from 'akso/lib/query-util';
import AKSOPayPaymentMethodResource from 'akso/lib/resources/aksopay-payment-method-resource';

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
		// Make sure the payment org exists and is accessible
		const paymentOrg = await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.first('org');
		if (!paymentOrg) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.read.' + paymentOrg.org)) {
			return res.sendStatus(403);
		}

		const query = AKSO.db('pay_methods')
			.where({
				id: req.params.paymentMethodId,
				paymentOrgId: req.params.paymentOrgId
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new AKSOPayPaymentMethodResource(row, req, schema);
		res.sendObj(obj);
	}
};
