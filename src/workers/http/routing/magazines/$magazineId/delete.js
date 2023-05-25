import { deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './editions/$editionId/thumbnail/schema';

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
		
		const orgPerm = 'magazines.delete.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		// Find and delete all magazine edition files
		const fileS3Ids = await AKSO.db('magazines_editions_files')
			.where({
				magazineId: req.params.magazineId,
			})
			.pluck('s3Id');
		if (fileS3Ids.length) {
			await deleteObjects({ keys: fileS3Ids });
		}

		// Find and delete all magazine edition toc entry recitations
		const recitationS3Ids = await AKSO.db('magazines_editions_toc_recitations')
			.pluck('s3Id')
			.join('magazines_editions_toc', 'magazines_editions_toc.id', 'magazines_editions_toc_recitations.tocEntryId')
			.where({
				magazineId: req.params.magazineId,
			});
		if (recitationS3Ids.length) {
			await deleteObjects({ keys: recitationS3Ids });
		}

		// Find and delete all magazine edition thumbnails
		const thumbnailS3Ids = await AKSO.db('magazines_editions')
			.where({
				magazineId: req.params.magazineId,
			})
			.whereNotNull('thumbnailS3Id')
			.pluck('thumbnailS3Id');
		if (thumbnailS3Ids.length) {
			await deleteObjects({
				keys: thumbnailS3Ids.flatMap(s3Id => thumbnailSizes.map(size => `magazines-editions-thumbnails-${s3Id}-${size}`)),
			});
		}

		await AKSO.db('magazines')
			.where('id', req.params.magazineId)
			.delete();

		res.sendStatus(204);
	}
};
