import path from 'path';

import { removePathAndEmptyParents } from 'akso/lib/file-util';

export default {
	schema: {
		query: null,
		body: null
	},

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
		if (!req.hasPermission('congress_instances.update.' + orgData.org)) { return res.sendStatus(403); }

		const deleted = await AKSO.db('congresses_instances_locations')
			.where({
				congressInstanceId: req.params.instanceId,
				id: req.params.locationId
			})
			.delete();

		if (deleted) {
			const locPar = path.join(
				AKSO.conf.dataDir,
				'congress_instance_location_thumbnails',
				req.params.congressId
			);
			const locPath = path.join(
				locPar,
				req.params.instanceId,
				req.params.locationId
			);
			await removePathAndEmptyParents(locPar, locPath);
		}

		res.sendStatus(deleted ? 204 : 404);
	}
};
