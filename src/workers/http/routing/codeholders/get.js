import QueryUtil from 'akso/lib/query-util';
import CodeholderResource from 'akso/lib/resources/codeholder-resource';

import { schema as parSchema, memberFilter, memberFields, afterQuery } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
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

		let fieldWhitelist = null;
		if (req.memberFields) { fieldWhitelist = Object.keys(req.memberFields); }
		await QueryUtil.handleCollection({
			req,
			res,
			schema,
			query,
			Res: CodeholderResource,
			passToCol: [[ req, schema ]],
			fieldWhitelist,
			afterQuery
		});
	}
};
