import QueryUtil from '../../lib/query-util';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		maxQueryLimit: 300,
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('countries');
		await QueryUtil.handleCollection(req, res, schema, query);
	}
};
