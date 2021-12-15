import QueryUtil from 'akso/lib/query-util';

import { schema as parSchema } from './schema';

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
		const query = AKSO.db('magazines');
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
