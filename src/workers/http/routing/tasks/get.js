import AKSOOrganization from 'akso/lib/enums/akso-organization';

export default {
	schema: {},

	run: async function run (req, res) {
		const aksopayPaymentIntentOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.read.' + org));

		const tasks = {};
		if (aksopayPaymentIntentOrgs.length) {
			tasks.aksopay = {
				submitted: (await AKSO.db('pay_intents')
					.whereIn('org', aksopayPaymentIntentOrgs)
					.where('status', 'submitted')
					.count({ count: 1 })
				)[0].count,
				disputed: (await AKSO.db('pay_intents')
					.whereIn('org', aksopayPaymentIntentOrgs)
					.where('status', 'disputed')
					.count({ count: 1 })
				)[0].count
			};
		}

		if (req.hasPermission('registration.registrations.read')) {
			tasks.registration = {
				pending: (await AKSO.db('registration_entries')
					.where('status', 'pending')
					.count({ count: 1 })
				)[0].count
			};
		}

		res.sendObj(tasks);
	}
};
