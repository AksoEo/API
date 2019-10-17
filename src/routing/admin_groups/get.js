import QueryUtil from '../../lib/query-util';

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
		const query = AKSO.db('admin_groups');
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
