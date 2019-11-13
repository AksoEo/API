import QueryUtil from 'akso/lib/query-util';

import parSchema from 'akso/workers/http/routing/congresses/$congressId/instances/$instanceId/location_tags/schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
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

		const query = AKSO.db('congresses_instances_locations_tags')
			.innerJoin('congresses_instances_locationTags', 'id', 'congressInstanceLocationTagId')
			.where({
				congressInstanceId: req.params.instanceId,
				congressInstanceLocationId: req.params.locationId
			});
		await QueryUtil.handleCollection({ req, res, schema, query });
	}
};
