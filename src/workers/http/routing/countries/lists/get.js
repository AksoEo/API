import QueryUtil from 'akso/lib/query-util';
import CountryListResource from 'akso/lib/resources/country-list-resource';

import { schema as parSchema, afterQuery }  from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		requirePerms: [
			'countries.lists.read',
			'codeholders.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('countries_lists');
		await QueryUtil.handleCollection({
			req, res, schema, query, Res: CountryListResource,
			passToCol: [[req, schema]], afterQuery
		});
	}
};
