import path from 'path';

import { removePathAndEmptyParents } from 'akso/lib/file-util';

export default {
	schema: {},

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.update.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const deleted = await AKSO.db('magazines_editions_toc')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.tocEntryId
			})
			.delete();

		if (deleted) {
			const tocParent = path.join(
				AKSO.conf.dataDir,
				'magazine_edition_toc_recitation',
				req.params.magazineId
			);
			const tocDir = path.join(
				tocParent,
				req.params.editionId,
				req.params.tocEntryId
			);

			await removePathAndEmptyParents(tocParent, tocDir);
		}

		res.sendStatus(deleted ? 204 : 404);
	}
};
