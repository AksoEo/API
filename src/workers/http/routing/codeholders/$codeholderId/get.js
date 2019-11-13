import QueryUtil from 'akso/lib/query-util';
import CodeholderResource from 'akso/lib/resources/codeholder-resource';

import { schema as parSchema, memberFilter, memberFields, afterQuery } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'codeholders.read'
	}
};
schema.alwaysWhere = (query, req) => memberFilter(schema, query, req);

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('view_codeholders');

		// Restrictions
		if (!memberFields(schema, req, res, 'r')) { return; }

		QueryUtil.simpleResource(req, schema, query);
		query.where('id', req.params.codeholderId);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const codeholder = new CodeholderResource(row, req, schema);
		res.sendObj(codeholder);
	}
};
