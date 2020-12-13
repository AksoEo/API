import QueryUtil from 'akso/lib/query-util';
import RegistrationOptionsResource from 'akso/lib/resources/registration-options-resource';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import { schema as parSchema, afterQuery } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'registration.options.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check perms
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.read.' + org));
		if (!orgs.length) { return res.sendStatus(403); }

		const query = AKSO.db('registration_options')
			.innerJoin('pay_orgs', 'paymentOrgId', 'pay_orgs.id')
			.whereIn('org', orgs);
		await QueryUtil.handleCollection({
			req, res, schema, query, afterQuery,
			Res: RegistrationOptionsResource,
			passToCol: [[ req, schema ]]
		});
	}
};
