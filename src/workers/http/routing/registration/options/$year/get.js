import QueryUtil from 'akso/lib/query-util';
import RegistrationOptionsResource from 'akso/lib/resources/registration-options-resource';

import { schema as parSchema, afterQuery } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'registration.options.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Obtain org
		const orgData = await AKSO.db('registration_options')
			.innerJoin('pay_orgs', 'paymentOrgId', 'pay_orgs.id')
			.where('year', req.params.year)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.read.' + orgData.org)) {
			return res.sendStatus(403);
		}

		const query = AKSO.db('registration_options')
			.where('year', req.params.year);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new RegistrationOptionsResource(row, req, parSchema);
		res.sendObj(obj);
	}
};
