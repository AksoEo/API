import { deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './schema';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.update.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		// Make sure the edition exists
		const edition = await AKSO.db('magazines_editions')
			.first('thumbnailS3Id')
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId,
			})
			.whereNotNull('thumbnailS3Id');
		if (!edition) { return res.sendStatus(404); }

		// Delete the pictures
		await deleteObjects({
			keys: thumbnailSizes.map(size => `magazines-editions-thumbnails-${edition.thumbnailS3Id}-${size}`),
		});

		// Update the db
		await AKSO.db('magazines_editions')
			.where('id', req.params.editionId)
			.update('thumbnailS3Id', null);
		
		res.sendStatus(204);
	}
};
