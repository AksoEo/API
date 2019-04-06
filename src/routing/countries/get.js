import QueryUtil from '../../lib/query-util';
import SimpleCollection from '../../lib/simple-collection';

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
		QueryUtil.simpleCollection(req, schema, query);

		const countries = new SimpleCollection(await query);
		res.sendObj(countries);
	}
};
