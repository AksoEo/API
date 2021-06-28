import QueryUtil from 'akso/lib/query-util';
import CountryListResource from 'akso/lib/resources/country-list-resource';

import { schema as parSchema, afterQuery } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		requirePerms: [
			'countries.lists.read',
			'codeholders.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('countries_lists')
			.where('name', req.params.listName);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new CountryListResource(row, req, schema);
		res.sendObj(obj);
	}
};
