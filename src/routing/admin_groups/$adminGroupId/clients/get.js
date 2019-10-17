import QueryUtil from '../../../../lib/query-util';

import parSchema from '../../../clients/schema';

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
		const query = AKSO.db('clients')
			.innerJoin('admin_groups_members_clients', 'admin_groups_members_clients.apiKey', 'clients.apiKey')
			.where('adminGroupId', req.params.adminGroupId);
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
