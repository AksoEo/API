import QueryUtil from '../../../lib/query-util';
import CodeholderResource from '../../../lib/resources/codeholder-resource';

import { schema as parSchema, memberFilter } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'codeholders.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('view_codeholders');

		// Restrictions
		memberFilter(schema, query, req);

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
