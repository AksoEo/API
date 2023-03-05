import QueryUtil from 'akso/lib/query-util';
import IntermediaryResource from 'akso/lib/resources/intermediary-resource';

import { schema as parSchema, afterQuery } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: ['intermediaries.read', 'codeholders.read']
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('intermediaries')
			.groupBy('countryCode');
		await QueryUtil.handleCollection({
			req, res, schema, query, afterQuery,
			Res: IntermediaryResource, passToCol: [[req, parSchema]],
		});
	}
};
