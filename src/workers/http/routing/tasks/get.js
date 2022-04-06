import AKSOOrganization from 'akso/lib/enums/akso-organization';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

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
					.where({
						status: 'submitted',
						intermediaryCountryCode: null,
					})
					.count({ count: 1 })
				)[0].count,
				disputed: (await AKSO.db('pay_intents')
					.whereIn('org', aksopayPaymentIntentOrgs)
					.where({
						status: 'disputed',
						intermediaryCountryCode: null,
					})
					.count({ count: 1 })
				)[0].count,
				intermediary: (await AKSO.db('pay_intents')
					.whereIn('org', aksopayPaymentIntentOrgs)
					.where({
						status: 'submitted',
					})
					.whereNotNull('intermediaryCountryCode')
					.count({ count: 1 })
				)[0].count,
			};
		}

		if (req.hasPermission('codeholders.read')) {
			if (req.hasPermission('registration.registrations.read')) {
				tasks.registration = {
					pending: (await AKSO.db('registration_entries')
						.where('status', 'pending')
						.count({ count: 1 })
					)[0].count
				};
			}

			if (req.hasPermission('codeholders.change_requests.read')) {
				tasks.codeholderChangeRequests = {
					pending: (await AKSO.db('codeholders_changeRequests')
						.where('status', 'pending')
						.count({ count: 1 })
						.whereExists(function () {
							this.select(1)
								.from('view_codeholders')
								.whereRaw('view_codeholders.id = codeholders_changeRequests.id');
							memberFilter(codeholderSchema, this, req);
						})
					)[0].count
				};
			}
		}

		res.sendObj(tasks);
	}
};
