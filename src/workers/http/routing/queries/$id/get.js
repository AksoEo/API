import QueryUtil from '../../../../../lib/query-util';
import SimpleResource from '../../../../../lib/resources/simple-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'queries.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('savedQueries');
		QueryUtil.simpleResource(req, schema, query);
		query.where('id', req.params.id);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new SimpleResource(row);
		res.sendObj(obj);
	}
};
