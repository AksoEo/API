import { deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './instances/$instanceId/locations/$locationId/thumbnail/schema';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const congress = await AKSO.db('congresses')
			.first('org')
			.where('id', req.params.congressId);
		if (!congress) { return res.sendStatus(404); }
		
		const orgPerm = 'congresses.delete.' + congress.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		// Delete all location thumbnails
		const thumbnailS3Ids = await AKSO.db('congresses_instances_locations')
			.join('congresses_instances', 'congresses_instances.id', 'congresses_instances_locations.congressInstanceId')
			.join('congresses', 'congresses.id', 'congresses_instances.congressId')
			.where('congresses.id', req.params.congressId)
			.whereNotNull('thumbnailS3Id')
			.pluck('thumbnailS3Id');

		if (thumbnailS3Ids.length) {
			await deleteObjects({
				keys: thumbnailS3Ids.flatMap(s3Id => thumbnailSizes.map(size => `congresses-locations-thumbnails-${s3Id}-${size}`)),
			});
		}

		// Delete the congress
		await AKSO.db('congresses')
			.where('id', req.params.congressId)
			.delete();

		res.sendStatus(204);
	}
};
