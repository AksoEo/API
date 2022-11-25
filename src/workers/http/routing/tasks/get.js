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
								.whereRaw('view_codeholders.id = codeholders_changeRequests.codeholderId');
							memberFilter(codeholderSchema, this, req);
						})
					)[0].count
				};
			}

			tasks.delegates = {};

			const delegationApplicationOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
				.filter(org => req.hasPermission('delegations.applications.read.' + org));
			if (delegationApplicationOrgs.length) {
				tasks.delegates.pendingApplications = (await AKSO.db('delegations_applications')
					.where('status', 'pending')
					.whereIn('org', delegationApplicationOrgs)
					.count({ count: 1 })
					.whereExists(function () {
						this.select(1)
							.from('view_codeholders')
							.whereRaw('view_codeholders.id = delegations_applications.codeholderId');
						memberFilter(codeholderSchema, this, req);
					})
				)[0].count;
			}

			const delegatesOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
				.filter(org => req.hasPermission('codeholders.delegations.read.' + org));

			if (delegatesOrgs.length && req.hasPermission('geodb.read')) {
				tasks.delegates.missingGeodbCities = (await AKSO.db('codeholders_delegations_cities')
					.distinct('city')
					.pluck('city')
					.whereIn('org', delegatesOrgs)
					.whereNotExists(function () {
						this.withSchema(AKSO.conf.mysql.geodbDatabase)
							.from('cities')
							.whereRaw('??.cities.id = codeholders_delegations_cities.city', [AKSO.conf.mysql.geodbDatabase]);
					})
					.limit(10)
				).map(x => `Q${x}`);
			}
			
			if (!Object.keys(tasks.delegates).length) {
				delete tasks.delegates;
			}

			const magazineOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
				.filter(org => req.hasPermission('magazines.read.' + org));

			if (magazineOrgs.length) {
				tasks.magazines = {};

				const magazineSubscriberOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
					.filter(org => req.hasPermission('magazines.subscriptions.read.' + org));

				if (magazineSubscriberOrgs.length && req.hasPermission('codeholders.read')) {
					tasks.magazines.paperNoAddress = (await AKSO.db('magazines_subscriptions')
						.innerJoin('view_codeholders', 'view_codeholders.id', 'magazines_subscriptions.codeholderId')
						.innerJoin('magazines', 'magazines.id', 'magazines_subscriptions.magazineId')
						.where('paperVersion', true)
						.where('magazines_subscriptions.year', '<=', (new Date()).getFullYear())
						.whereIn('org', magazineSubscriberOrgs)
						.where(function () {
							this.where('addressInvalid', true)
								.orWhereNull('address_streetAddress');
						})
						.whereExists(function () {
							this.from('view_codeholders AS v')
								.whereRaw('v.id = magazines_subscriptions.codeholderId');
							memberFilter(codeholderSchema, this, req);
						})
						.count({ count: 1 })
					)[0].count;
				}
			}
		}

		res.sendObj(tasks);
	}
};
