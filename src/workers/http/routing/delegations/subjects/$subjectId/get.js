import QueryUtil from 'akso/lib/query-util';
import SimpleResource from 'akso/lib/resources/simple-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'delegations.subjects.read.uea' // currently only UEA
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('delegations_subjects')
			.where('id', req.params.subjectId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new SimpleResource(row);
		res.sendObj(obj);
	}
};
