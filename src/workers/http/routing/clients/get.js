import QueryUtil from 'akso/lib/query-util';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'clients.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('clients');
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
