import QueryUtil from 'akso/lib/query-util';
import CongressInstanceRegistrationFormResource from 'akso/lib/resources/congress-instance-registration-form-resource';

import { schema as parSchema, afterQuery } from './schema';

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
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.read.' + orgData.org)) { return res.sendStatus(403); }

		const query = AKSO.db('congresses_instances_registrationForm')
			.where({
				congressInstanceId: req.params.instanceId
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new CongressInstanceRegistrationFormResource(row, req, schema);
		res.sendObj(obj);
	}
};
