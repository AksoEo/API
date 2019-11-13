import QueryUtil from 'akso/lib/query-util';
import CountryResource from 'akso/lib/resources/country-resource';

import parSchema from '../schema';

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
		const query = AKSO.db('countries');
		QueryUtil.simpleResource(req, schema, query);
		query.where('code', req.params.countryCode);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CountryResource(row);
		res.sendObj(obj);
	}
};
