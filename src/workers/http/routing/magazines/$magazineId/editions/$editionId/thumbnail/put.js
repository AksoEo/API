import path from 'path';
import fs from 'fs-extra';
import * as Canvas from 'canvas';

import { cropImgToSizes } from 'akso/workers/http/lib/canvas-utils';

import { thumbnailSizes } from './schema';

const mimeTypes = [
	'image/jpeg',
	'image/png'
];

export default {
	schema: {
		query: null,
		body: null,
		multipart: [
			{
				name: 'thumbnail',
				maxCount: 1,
				minCount: 1,
				maxSize: '5mb',
				mimeCheck: mime => mimeTypes.includes(mime)
			}
		]
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

		const tmpFile = req.files.thumbnail[0];
		// Try to load the picture
		let img;
		try {
			img = await Canvas.loadImage(tmpFile.path);
		} catch (e) {
			const err = new Error('Unable to load picture');
			err.statusCode = 400;
			throw err;
		}

		// Crop and scale the picture to all the necessary sizes
		const pictures = cropImgToSizes(img, tmpFile.mimetype, thumbnailSizes, false);

		// Ensure the dir for the thumbnails exists
		const picDir = path.join(
			AKSO.conf.dataDir,
			'magazine_edition_thumbnails',
			req.params.magazineId,
			req.params.editionId
		);
		await fs.ensureDir(picDir);

		// Write all files
		const writePromises = [
			// Write the info file
			fs.writeFile(path.join(picDir, 'pic.txt'), JSON.stringify({
				mime: tmpFile.mimetype
			}))
		];

		// Write the pictures
		for (let [size, picture] of Object.entries(pictures)) {
			writePromises.push(
				fs.writeFile(path.join(picDir, size), picture)
			);
		}

		// Wait for the writes to finish
		await Promise.all(writePromises);

		res.sendStatus(204);
	}
};
