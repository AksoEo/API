import QueryUtil from 'akso/lib/query-util';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'delegations.subjects.read.uea' // currently only UEA
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('delegations_subjects');

		await QueryUtil.handleCollection({
			req, res, schema, query
		});
	}
};
