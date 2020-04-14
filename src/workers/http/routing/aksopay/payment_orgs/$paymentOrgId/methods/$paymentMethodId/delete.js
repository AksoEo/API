import path from 'path';

import { removePathAndEmptyParents } from 'akso/lib/file-util';

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the payment org exists and is accessible
		const paymentOrg = await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.first('org');
		if (!paymentOrg) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_methods.delete.' + paymentOrg.org)) {
			return res.sendStatus(403);
		}

		const deleted = await AKSO.db('pay_methods')
			.where({
				id: req.params.paymentMethodId,
				paymentOrgId: req.params.paymentOrgId
			})
			.delete();

		if (deleted) {
			const locPar = path.join(
				AKSO.conf.dataDir,
				'aksopay_payment_method_thumbnails',
				req.params.paymentOrgId
			);
			const locPath = path.join(
				locPar,
				req.params.paymentMethodId
			);
			await removePathAndEmptyParents(locPar, locPath);
		}

		res.sendStatus(deleted ? 204 : 404);
	}
};
