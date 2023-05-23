import { deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './thumbnail/schema';

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

		const locData = await AKSO.db('congresses_instances_locations')
			.where({
				congressInstanceId: req.params.instanceId,
				id: req.params.locationId
			})
			.first('thumbnailS3Id');
		if (!locData) { return res.sendStatus(404); }

		// Delete the thumbnail if it exists
		if (locData.thumbnailS3Id) {
			await deleteObjects({
				keys: thumbnailSizes.map(size => `congresses-locations-thumbnails-${locData.thumbnailS3Id}-${size}`),
			});
		}

		// Delete the location
		await AKSO.db('congresses_instances_locations')
			.where({
				congressInstanceId: req.params.instanceId,
				id: req.params.locationId
			})
			.delete();

		res.sendStatus(204);
	}
};
