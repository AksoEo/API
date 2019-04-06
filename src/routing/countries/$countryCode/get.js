import QueryUtil from '../../../lib/query-util';
import SimpleResource from '../../../lib/simple-resource';

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
		let country;
		try {
			country = new SimpleResource(row);
		} catch (e) {
			return res.sendStatus(404);
		}
		res.sendObj(country);
	}
};
