import QueryUtil from 'akso/lib/query-util';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import parSchema from './schema';

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
			.filter(org => req.hasPermission('pay.read.' + org));
		if (!orgs.length) { return res.sendStatus(403); }

		const query = AKSO.db('pay_orgs')
			.whereIn('org', orgs);
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
