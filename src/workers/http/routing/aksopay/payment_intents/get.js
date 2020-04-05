import QueryUtil from 'akso/lib/query-util';
import AKSOPayPaymentIntentResource from 'akso/lib/resources/aksopay-payment-intent-resource';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import { schema as parSchema, afterQuery } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check perms
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.read.' + org));
		if (!orgs.length) { return res.sendStatus(403); }

		const mayAccessSensitiveData = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.sensitive_data.' + org));

		const query = AKSO.db('pay_intents')
			.whereIn('org', orgs);
		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: AKSOPayPaymentIntentResource,
			passToCol: [[ req, parSchema, mayAccessSensitiveData ]],
			afterQuery
		});
	}
};
