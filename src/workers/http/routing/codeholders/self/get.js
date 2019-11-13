import QueryUtil from 'akso/lib/query-util';
import CodeholderResource from 'akso/lib/resources/codeholder-resource';

import { schema as parSchema, memberFields } from '../schema';

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
		const query = AKSO.db('view_codeholders');

		// Restrictions
		if (!memberFields(schema, req, res, 'r', req.ownMemberFields)) { return; }

		QueryUtil.simpleResource(req, schema, query);
		query.where('id', req.user.user);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CodeholderResource(row, req, schema);
		res.sendObj(obj);
	}
};
