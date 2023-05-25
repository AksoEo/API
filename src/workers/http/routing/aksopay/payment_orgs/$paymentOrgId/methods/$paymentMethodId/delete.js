import { deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './thumbnail/schema';

export default {
	schema: {},

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
		if (!req.hasPermission('pay.payment_methods.delete.' + paymentMethod.org)) {
			return res.sendStatus(403);
		}

		// Delete the payment method's thumbnail if it exists
		if (paymentMethod.thumbnailS3Id) {
			await deleteObjects({ keys: thumbnailSizes.map(size => `aksopay-paymentMethod-thumbnails-${paymentMethod.thumbnailS3Id}-${size}`) });
		}

		await AKSO.db('pay_methods')
			.where({
				id: req.params.paymentMethodId,
				paymentOrgId: req.params.paymentOrgId
			})
			.delete();

		res.sendStatus(204);
	}
};
