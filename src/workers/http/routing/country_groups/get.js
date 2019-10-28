import QueryUtil from '../../../../lib/query-util';
import CountryGroupResource from '../../../../lib/resources/country-group-resource';

import parSchema from './schema';

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
		const query = AKSO.db('countries_groups')
			.leftJoin('countries_groups_members', 'code', 'group_code')
			.groupBy('code');
		await QueryUtil.handleCollection({ req, res, schema, query, Res: CountryGroupResource });
	}
};
