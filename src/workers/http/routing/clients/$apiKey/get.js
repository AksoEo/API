import QueryUtil from '../../../../../lib/query-util';
import SimpleResource from '../../../../../lib/resources/simple-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'clients.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('clients');

		QueryUtil.simpleResource(req, schema, query);
		query.where('apiKey', Buffer.from(req.params.apiKey, 'hex'));
		const row = await query;
		try {
			const resource = new SimpleResource(row);
			res.sendObj(resource);
		} catch (e) {
			if (e.simpleResourceError) { return res.sendStatus(404); }
			throw e;
		}
	}
};
