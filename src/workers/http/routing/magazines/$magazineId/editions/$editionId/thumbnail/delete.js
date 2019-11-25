import path from 'path';
import fs from 'fs-extra';

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
		
		const orgPerm = 'magazines.update.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		// Make sure the edition exists
		const editionExists = await AKSO.db('magazines_editions')
			.first(1)
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			});
		if (!editionExists) { return res.sendStatus(404); }

		const picParent = path.join(
			AKSO.conf.dataDir,
			'magazine_edition_thumbnails',
			req.params.magazineId
		);
		const picDir = path.join(
			picParent,
			req.params.editionId
		);

		if (!await fs.exists(picDir)) { return res.sendStatus(404); }

		await removePathAndEmptyParents(picParent, picDir);
		
		res.sendStatus(204);
	}
};
