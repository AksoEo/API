import path from 'path';
import fs from 'fs-extra';

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
		// Make sure the payment method exists and is accessible
		const paymentMethod = await AKSO.db('pay_methods')
			.innerJoin('pay_orgs', 'paymentOrgId', 'pay_orgs.id')
			.where({
				'pay_methods.id': req.params.paymentMethodId,
				'pay_orgs.id': req.params.paymentOrgId
			})
			.first('org');
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

		// Ensure the dir for the thumbnails exists
		const picDir = path.join(
			AKSO.conf.dataDir,
			'aksopay_payment_method_thumbnails',
			req.params.paymentOrgId,
			req.params.paymentMethodId
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
