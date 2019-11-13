import QueryUtil from 'akso/lib/query-util';
import CountryGroupResource from 'akso/lib/resources/country-group-resource';

import { schema as parSchema, afterQuery } from './schema';

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
		const query = AKSO.db('countries_groups');
		await QueryUtil.handleCollection({
			req,
			res,
			schema,
			query,
			Res: CountryGroupResource,
			afterQuery,
			passToCol: [[ req, schema ]]
		});
	}
};
