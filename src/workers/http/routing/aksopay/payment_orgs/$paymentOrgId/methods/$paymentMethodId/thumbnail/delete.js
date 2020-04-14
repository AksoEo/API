import path from 'path';
import fs from 'fs-extra';

import { removePathAndEmptyParents } from 'akso/lib/file-util';

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
			.first('org');
		if (!paymentMethod) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_methods.update.' + paymentMethod.org)) {
			return res.sendStatus(403);
		}

		const picParent = path.join(
			AKSO.conf.dataDir,
			'aksopay_payment_method_thumbnails',
			req.params.paymentOrgId
		);
		const picDir = path.join(
			picParent,
			req.params.paymentMethodId
		);

		if (!await fs.exists(picDir)) { return res.sendStatus(404); }

		await removePathAndEmptyParents(picParent, picDir);

		res.sendStatus(204);
	}
};
