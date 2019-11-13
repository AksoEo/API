import QueryUtil from 'akso/lib/query-util';
import CountryGroupResource from 'akso/lib/resources/country-group-resource';

import { schema as parSchema, afterQuery } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('countries_groups')
			.where('code', req.params.group);

		QueryUtil.simpleResource(req, schema, query);
		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new CountryGroupResource(row, req, schema);
		res.sendObj(obj);
	}
};
