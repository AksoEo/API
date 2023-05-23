import { deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './schema';

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

		// Check if the thumbnail and location exist
		const locationData = await AKSO.db('congresses_instances_locations')
			.first('thumbnailS3Id')
			.where({
				id: req.params.locationId,
				congressInstanceId: req.params.instanceId,
			});
		if (!locationData || !locationData.thumbnailS3Id) { return res.sendStatus(404); }

		// Delete the pictures
		await deleteObjects({
			keys: thumbnailSizes.map(size => `congresses-locations-thumbnails-${locationData.thumbnailS3Id}-${size}`),
		});

		// Update the db
		await AKSO.db('congresses_instances_locations')
			.where('id', req.params.locationId)
			.update('thumbnailS3Id', null);

		res.sendStatus(204);
	}
};
