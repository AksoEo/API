import QueryUtil from 'akso/lib/query-util';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'admin_groups.read'
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

		const query = AKSO.db('admin_permissions_groups')
			.where('adminGroupId', req.params.adminGroupId);
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
