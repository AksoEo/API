import AKSOOrganization from 'akso/lib/enums/akso-organization';

export default {
	schema: {},

	run: async function run (req, res) {
		const aksopayPaymentIntentOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.read.' + org));

		const tasks = {};
		if (aksopayPaymentIntentOrgs.length) {
			tasks.aksopay = {
				submitted: await AKSO.db('pay_intents')
					.whereIn('org', aksopayPaymentIntentOrgs)
					.where('status', 'submitted')
					.count('1'),
				disputed: await AKSO.db('pay_intents')
					.whereIn('org', aksopayPaymentIntentOrgs)
					.where('status', 'disputed')
					.count('1')
			};
		}

		res.sendObj(tasks);
	}
};
