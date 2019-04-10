import QueryUtil from '../../lib/query-util';
import CodeholderResource from '../../lib/resources/codeholder-resource';
import SimpleCollection from '../../lib/simple-collection';

import { schema as parSchema, memberFilter } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
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

		await QueryUtil.handleCollection(req, res, schema, query, CodeholderResource, SimpleCollection, [[ req, schema ]]);
	}
};
