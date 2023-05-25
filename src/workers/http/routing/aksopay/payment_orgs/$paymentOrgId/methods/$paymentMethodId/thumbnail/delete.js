import { deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './schema';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		// Make sure the payment method exists and is accessible
		const paymentMethod = await AKSO.db('pay_methods')
			.innerJoin('pay_orgs', 'paymentOrgId', 'pay_orgs.id')
			.where({
				'pay_methods.id': req.params.paymentMethodId,
				'pay_orgs.id': req.params.paymentOrgId
			})
			.whereNotNull('thumbnailS3Id')
			.first('org', 'thumbnailS3Id');
		if (!paymentMethod) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_methods.update.' + paymentMethod.org)) {
			return res.sendStatus(403);
		}

		// Delete the pictures
		await deleteObjects({
			keys: thumbnailSizes.map(size => `aksopay-paymentMethod-thumbnails-${paymentMethod.thumbnailS3Id}-${size}`),
		});

		// Update the db
		await AKSO.db('pay_methods')
			.where('id', req.params.paymentMethodId)
			.update('thumbnailS3Id', null);

		res.sendStatus(204);
	}
};
