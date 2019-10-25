import QueryUtil from '../../lib/query-util';
import VoteResource from '../../lib/resources/vote-resource';

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
		const query = AKSO.db('votes');
		await QueryUtil.handleCollection({ req, res, schema, query, Res: VoteResource });
	}
};
