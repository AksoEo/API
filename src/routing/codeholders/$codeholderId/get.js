import QueryUtil from '../../../lib/query-util';
import CodeholderResource from '../../../lib/resources/codeholder-resource';

import { schema as parSchema, memberFilter, memberFields } from '../schema';

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
		try {
			const codeholder = new CodeholderResource(row, req, schema);
			res.sendObj(codeholder);
		} catch (e) {
			if (e.simpleResourceError) { return res.sendStatus(404); }
			throw e;
		}
	}
};
