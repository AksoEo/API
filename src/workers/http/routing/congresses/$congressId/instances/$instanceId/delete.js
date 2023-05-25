import { deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './locations/$locationId/thumbnail/schema';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const congress = await AKSO.db('congresses_instances')
			.join('congresses', 'congresses.id', 'congresses_instances.congressId')
			.first('org')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId,
			});
		if (!congress) { return res.sendStatus(404); }
		
		const orgPerm = 'congress_instances.delete.' + congress.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		// Delete all location thumbnails
		const thumbnailS3Ids = await AKSO.db('congresses_instances_locations')
			.where('congressInstanceId', req.params.instanceId)
			.whereNotNull('thumbnailS3Id')
			.pluck('thumbnailS3Id');

		if (thumbnailS3Ids.length) {
			await deleteObjects({
				keys: thumbnailS3Ids.flatMap(s3Id => thumbnailSizes.map(size => `congresses-locations-thumbnails-${s3Id}-${size}`)),
			});
		}

		// Delete the instance
		await AKSO.db('congresses_instances')
			.where({
				id: req.params.instanceId
			})
			.delete();

		res.sendStatus(204);
	}
};
