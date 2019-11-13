import QueryUtil from 'akso/lib/query-util';

import parSchema from 'akso/workers/http/routing/clients/schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: [
			'admin_groups.read',
			'clients.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Make sure the admin group exists
		const exists = await AKSO.db('admin_groups')
			.where('id', req.params.adminGroupId)
			.first(1);
		if (!exists) {
			return res.sendStatus(404);
		}

		const query = AKSO.db('clients')
			.innerJoin('admin_groups_members_clients', 'admin_groups_members_clients.apiKey', 'clients.apiKey')
			.where('adminGroupId', req.params.adminGroupId);
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
