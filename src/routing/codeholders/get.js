import QueryUtil from '../../lib/query-util';
import CodeholderResource from '../../lib/resources/codeholder-resource';
import SimpleCollection from '../../lib/simple-collection';

import { schema as parSchema, memberFilter, memberFields } from './schema';

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

		await QueryUtil.handleCollection(req, res, schema, query, CodeholderResource, SimpleCollection, [[ req, schema ]]);
	}
};
