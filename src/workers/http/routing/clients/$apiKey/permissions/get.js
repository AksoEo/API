import QueryUtil from 'akso/lib/query-util';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: [
			'clients.read',
			'clients.perms.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Make sure the client exists
		const exists = await AKSO.db('clients')
			.where('apiKey', req.params.apiKey)
			.first(1);
		if (!exists) {
			return res.sendStatus(404);
		}

		const query = AKSO.db('admin_permissions_clients')
			.where('apiKey', req.params.apiKey);
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
