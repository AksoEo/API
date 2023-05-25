import { deleteObjects } from 'akso/lib/s3';

import { thumbnailSizes } from './methods/$paymentMethodId/thumbnail/schema';

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_orgs.delete.' + orgData.org)) { return res.sendStatus(403); }

		// Find all payment method thumbnails and delete them
		const thumbnailS3Ids = await AKSO.db('pay_methods')
			.pluck('thumbnailS3Id')
			.where('paymentOrgId', req.params.paymentOrgId)
			.whereNotNull('thumbnailS3Id');
		if (thumbnailS3Ids.length) {
			await deleteObjects({
				keys: thumbnailS3Ids.flatMap(s3Id => thumbnailSizes.map(size => `aksopay-paymentMethod-thumbnails-${s3Id}-${size}`)),
			});
		}

		await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.delete();

		res.sendStatus(204);
	}
};
