import fs from 'node:fs';

import { putObject, deleteObject } from 'akso/lib/s3';

export default {
	schema: {
		query: null,
		body: null,
		multipart: [
			{
				name: 'file',
				maxCount: 1,
				minCount: 1,
				maxSize: '80mb',
			},
		],
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
				id: req.params.tocEntryId,
			});
		if (!exists) { return res.sendStatus(404); }

		const existingRecitation = await AKSO.db('magazines_editions_toc_recitations')
			.first('s3Id')
			.where({
				tocEntryId: req.params.tocEntryId,
				format: req.params.format,
			});

		if (existingRecitation?.s3Id) {
			await deleteObject(existingRecitation.s3Id);
		}

		const putOut = await putObject({
			body: fs.createReadStream(req.files.file[0].path),
			keyPrefix: 'magazines-editions-toc-recitation',
			contentType: req.files.file[0].mimetype,
		});

		await AKSO.db('magazines_editions_toc_recitations')
			.insert({
				tocEntryId: req.params.tocEntryId,
				format: req.params.format,
				s3Id: putOut.key,
				size: req.files.file[0].size,
			})
			.onConflict()
			.merge();

		res.sendStatus(204);
	}
};
