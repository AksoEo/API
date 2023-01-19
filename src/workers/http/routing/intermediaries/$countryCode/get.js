import QueryUtil from 'akso/lib/query-util';
import SimpleResource from 'akso/lib/resources/simple-resource';

import { schema as parSchema, afterQuery } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: ['intermediaries.read', 'codeholders.read']
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('intermediaries')
			.groupBy('countryCode')
			.where('countryCode', req.params.countryCode);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new SimpleResource(row);
		res.sendObj(obj);
	}
};
