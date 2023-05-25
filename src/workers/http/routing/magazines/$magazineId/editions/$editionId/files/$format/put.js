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
				maxSize: '100mb'
			},
		],
	},

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org', 'name')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.files.update.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const edition = await AKSO.db('magazines_editions')
			.first('idHuman')
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			});
		if (!edition) { return res.sendStatus(404); }

		const mimeTypes = {
			epub: 'application/epub+zip',
			pdf: 'application/pdf',
		};
		const name = `${magazine.name}-${edition.idHuman ?? req.params.editionId}.${req.params.format}`;

		// Upload the file
		const file = req.files.file[0];
		const putRes = await putObject({
			body: fs.createReadStream(file.path),
			keyPrefix: 'magazines-editions-files',
			contentType: mimeTypes[req.params.format],
			params: {
				ContentDisposition: 'inline; filename*=UTF-8\'\'' + encodeURIComponent(name),
			},
		});

		// Delete the old file if it exists
		const oldData = await AKSO.db('magazines_editions_files')
			.first('s3Id')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				format: req.params.format,
			});
		if (oldData) {
			await deleteObject(oldData.s3Id);
		}

		// Update the db
		await AKSO.db('magazines_editions_files')
			.insert({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				format: req.params.format,
				s3Id: putRes.key,
				size: file.size,
			})
			.onConflict()
			.merge();

		res.sendStatus(204);
	}
};
