import { deleteObjects } from 'akso/lib/s3';
import { thumbnailSizes } from './thumbnail/schema';

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

		// Make sure the edition exists
		const edition = await AKSO.db('magazines_editions')
			.first('thumbnailS3Id')
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			});
		if (!edition) { return res.sendStatus(404); }

		// Find and delete all the edition's files
		const fileS3Ids = await AKSO.db('magazines_editions_files')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
			})
			.pluck('s3Id');
		if (fileS3Ids.length) {
			await deleteObjects({ keys: fileS3Ids });
		}

		// Find and delete all the edition's toc entry recitations
		const recitationS3Ids = await AKSO.db('magazines_editions_toc_recitations')
			.pluck('s3Id')
			.leftJoin('magazines_editions_toc', 'magazines_editions_toc.id', 'magazines_editions_toc_recitations.tocEntryId')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
			});
		if (recitationS3Ids.length) {
			await deleteObjects({ keys: recitationS3Ids });
		}

		// Delete the edition's thumbnail if it exists
		if (edition.thumbnailS3Id) {
			await deleteObjects({ keys: thumbnailSizes.map(size => `magazines-editions-thumbnails-${edition.thumbnailS3Id}-${size}`) });
		}

		// Delete from the db
		await AKSO.db('magazines_editions')
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			})
			.delete();

		res.sendStatus(204);
	}
};
