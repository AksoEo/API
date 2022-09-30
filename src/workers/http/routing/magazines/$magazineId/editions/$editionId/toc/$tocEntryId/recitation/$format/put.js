import fs from 'fs-extra';
import path from 'path';

import { insertAsInsertIgnore } from 'akso/util';

export default {
	schema: {
		query: null,
		body: null,
		multipart: [
			{
				name: 'file',
				maxCount: 1,
				minCount: 1,
				maxSize: '80mb'
			}
		]
	},

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.recitations.update.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const exists = await AKSO.db('magazines_editions_toc')
			.first(1)
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.tocEntryId
			});
		if (!exists) { return res.sendStatus(404); }

		const file = req.files.file[0];
		const filePath = path.join(
			AKSO.conf.dataDir,
			'magazine_edition_toc_recitation',
			req.params.magazineId,
			req.params.editionId,
			req.params.tocEntryId,
			req.params.format
		);

		await Promise.all([
			fs.move(file.path, filePath, { overwrite: true }),
			insertAsInsertIgnore(AKSO.db('magazines_editions_toc_recitations')
				.insert({
					tocEntryId: req.params.tocEntryId,
					format: req.params.format
				}))
		]);

		res.sendStatus(204);
	}
};
