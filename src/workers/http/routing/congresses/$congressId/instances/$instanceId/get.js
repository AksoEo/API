import QueryUtil from 'akso/lib/query-util';
import CongressInstanceResource from 'akso/lib/resources/congress-instance-resource';

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
		if (!req.hasPermission('congress_instances.read.' + orgData.org)) { return res.sendStatus(403); }

		const query = AKSO.db('congresses_instances')
			.where({
				congressId: req.params.congressId,
				id: req.params.instanceId
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CongressInstanceResource(row);
		res.sendObj(obj);
	}
};
