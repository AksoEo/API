import { v4 as uuidv4 } from 'uuid';

import { putObject, deleteObjects } from 'akso/lib/s3';
import { cropImgToSizes } from 'akso/workers/http/lib/canvas-util';

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
				maxSize: '12mb',
				mimeCheck: mime => mimeTypes.includes(mime)
			}
		]
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.read.' + orgData.org)) { return res.sendStatus(403); }

		// Make sure the location exists
		const editionExists = await AKSO.db('congresses_instances_locations')
			.first(1)
			.where({
				id: req.params.locationId,
				congressInstanceId: req.params.instanceId
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
				key: `congresses-locations-thumbnails-${s3Id}-${size}`,
				contentType: tmpFile.mimetype,
			}));
		}
		await Promise.all(uploadPromises);

		// Check if there is an old thumbnail to delete
		const oldData = await AKSO.db('congresses_instances_locations')
			.first('thumbnailS3Id')
			.where('id', req.params.locationId);
		if (oldData.thumbnailS3Id) {
			await deleteObjects({
				keys: thumbnailSizes.map(size => `congresses-locations-thumbnails-${oldData.thumbnailS3Id}-${size}`),
			});
		}

		// Update the db
		await AKSO.db('congresses_instances_locations')
			.where('id', req.params.locationId)
			.update({
				thumbnailS3Id: s3Id,
			});

		res.sendStatus(204);
	}
};
