import QueryUtil from '../../../../../lib/query-util';
import CountryResource from '../../../../../lib/resources/country-resource';

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
		try {
			const country = new CountryResource(row);
			res.sendObj(country);
		} catch (e) {
			if (e.simpleResourceError) { return res.sendStatus(404); }
			throw e;
		}
	}
};
