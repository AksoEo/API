import QueryUtil from 'akso/lib/query-util';

import parSchema from './schema';

import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: [
			'codeholders.read',
			'codeholders.perms.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const query = AKSO.db('admin_permissions_codeholders')
			.where('codeholderId', req.params.codeholderId);
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
