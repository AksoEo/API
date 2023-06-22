import QueryUtil from 'akso/lib/query-util';

import StatisticsResource from 'akso/lib/resources/statistics-resource';
import { schema as parSchema } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'statistics.read',
	},
};

export default {
	schema,

	run: async function run (req, res) {
		const query = AKSO.db('statistics');
		await QueryUtil.handleCollection({
			req, res, schema, query, Res: StatisticsResource,
		});
	}
};
