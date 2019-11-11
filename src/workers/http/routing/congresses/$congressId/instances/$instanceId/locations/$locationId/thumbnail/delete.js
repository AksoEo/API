import path from 'path';
import fs from 'fs-extra';

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

		const picDir = path.join(
			AKSO.conf.dataDir,
			'congress_instance_location_thumbnails',
			`${req.params.locationId}`
		);

		if (!await fs.exists(picDir)) { return res.sendStatus(404); }

		await fs.remove(picDir);
		res.sendStatus(204);
	}
};
