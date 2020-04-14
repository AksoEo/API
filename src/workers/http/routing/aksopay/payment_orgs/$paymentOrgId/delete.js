import path from 'path';
import fs from 'fs-extra';

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_orgs.delete.' + orgData.org)) { return res.sendStatus(403); }

		await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.delete();

		const dataPath = path.join(
			AKSO.conf.dataDir,
			'aksopay_payment_method_thumbnails',
			req.params.paymentOrgId
		);
		await fs.remove(dataPath);

		res.sendStatus(204);
	}
};
