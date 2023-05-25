import { v4 as uuidv4 } from 'uuid';

import { putObject, deleteObjects } from 'akso/lib/s3';
import { cropImgToSizes } from 'akso/workers/http/lib/canvas-util';

import { thumbnailSizes } from './schema';

const mimeTypes = [
	'image/jpeg',
	'image/png',
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
				magazineId: req.params.magazineId,
			});
		if (!editionExists) { return res.sendStatus(404); }

		const tmpFile = req.files.thumbnail[0];
		// Try to process the picture
		let pictures;
		try {
			// Crop and scale the picture to all the necessary sizes
			pictures = await cropImgToSizes(tmpFile.path, thumbnailSizes);
		} catch (e) {
			const err = new Error('Unable to load picture');
			err.statusCode = 400;
			throw err;
		}

		// Upload the pictures
		const uploadPromises = [];
		const s3Id = uuidv4();
		for (const [size, picture] of Object.entries(pictures)) {
			uploadPromises.push(putObject({
				body: picture,
				key: `magazines-editions-thumbnails-${s3Id}-${size}`,
				contentType: tmpFile.mimetype,
			}));
		}
		await Promise.all(uploadPromises);

		// Check if there is an old thumbnail to delete
		const oldData = await AKSO.db('magazines_editions')
			.first('thumbnailS3Id')
			.where('id', req.params.editionId);
		if (oldData.thumbnailS3Id) {
			await deleteObjects({
				keys: thumbnailSizes.map(size => `magazines-editions-thumbnails-${oldData.thumbnailS3Id}-${size}`),
			});
		}

		// Update the db
		await AKSO.db('magazines_editions')
			.where('id', req.params.editionId)
			.update({
				thumbnailS3Id: s3Id,
			});

		res.sendStatus(204);
	}
};
