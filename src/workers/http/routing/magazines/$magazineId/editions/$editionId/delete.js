import path from 'path';

import { removePathAndEmptyParents } from 'akso/lib/file-util';

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

		const deleted = await AKSO.db('magazines_editions')
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			})
			.delete();

		if (deleted) {
			const filesParPath = path.join(
				AKSO.conf.dataDir,
				'magazine_edition_files',
				req.params.magazineId
			);
			const filesEditionPath = path.join(
				filesParPath,
				req.params.editionId
			);

			const thumbnailParPath = path.join(
				AKSO.conf.dataDir,
				'magazine_edition_thumbnails',
				req.params.magazineId
			);
			const thumbnailEditionPath = path.join(
				filesParPath,
				req.params.editionId
			);

			const recitationParPath = path.join(
				AKSO.conf.dataDir,
				'magazine_toc_recitation',
				req.params.magazineId
			);
			const recitationEditionPath = path.join(
				recitationParPath,
				req.params.editionId
			);

			await Promise.all([
				removePathAndEmptyParents(filesParPath, filesEditionPath),
				removePathAndEmptyParents(thumbnailParPath, thumbnailEditionPath),
				removePathAndEmptyParents(recitationParPath, recitationEditionPath)
			]);
		}

		res.sendStatus(deleted ? 204 : 404);
	}
};
