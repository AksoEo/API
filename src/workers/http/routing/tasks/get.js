import AKSOOrganization from 'akso/lib/enums/akso-organization';

export default {
	schema: {},

	run: async function run (req, res) {
		const aksopayPaymentIntentOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.read.' + org));

		const tasks = {};
		if (aksopayPaymentIntentOrgs.length) {
			const tasksRaw = await AKSO.db('pay_intents')
				.whereIn('org', aksopayPaymentIntentOrgs)
				.count({
					submitted: AKSO.db.raw('status = "submitted"'),
					disputed: AKSO.db.raw('status = "disputed"')
				});
			tasks.aksopay = tasksRaw[0];
		}

		res.sendObj(tasks);
	}
};
