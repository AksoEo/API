import { v4 as uuidv4 } from 'uuid';

import { cropImgToSizes } from 'akso/workers/http/lib/canvas-util';
import { putObject, deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './schema';

const mimeTypes = [ 'image/jpeg', 'image/png' ];

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
				mimeCheck: mime => mimeTypes.includes(mime),
			},
		],
	},

	run: async function run (req, res) {
		// Make sure the payment method exists and is accessible
		const paymentMethod = await AKSO.db('pay_methods')
			.innerJoin('pay_orgs', 'paymentOrgId', 'pay_orgs.id')
			.where({
				'pay_methods.id': req.params.paymentMethodId,
				'pay_orgs.id': req.params.paymentOrgId
			})
			.first('org', 'thumbnailS3Id');
		if (!paymentMethod) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_methods.update.' + paymentMethod.org)) {
			return res.sendStatus(403);
		}

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
				key: `aksopay-paymentMethod-thumbnails-${s3Id}-${size}`,
				contentType: tmpFile.mimetype,
			}));
		}
		await Promise.all(uploadPromises);

		// Check if there is an old thumbnail to delete
		if (paymentMethod.thumbnailS3Id) {
			await deleteObjects({
				keys: thumbnailSizes.map(size => `aksopay-paymentMethod-thumbnails-${paymentMethod.thumbnailS3Id}-${size}`),
			});
		}

		// Update the db
		await AKSO.db('pay_methods')
			.where('id', req.params.paymentMethodId)
			.update({
				thumbnailS3Id: s3Id,
			});

		res.sendStatus(204);
	}
};
