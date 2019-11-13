import QueryUtil from 'akso/lib/query-util';
import SimpleResource from 'akso/lib/resources/simple-resource';

import parSchema from '../schema';

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
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('congresses')
			.where('id', req.params.congressId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congresses.read.' + orgData.org)) { return res.sendStatus(403); }

		const query = AKSO.db('congresses')
			.where('id', req.params.congressId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		const obj = new SimpleResource(row);
		res.sendObj(obj);
	}
};
