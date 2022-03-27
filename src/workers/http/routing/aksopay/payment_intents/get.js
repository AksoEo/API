import QueryUtil from 'akso/lib/query-util';
import AKSOPayPaymentIntentResource from 'akso/lib/resources/aksopay-payment-intent-resource';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import { schema as parSchema, afterQuery } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check perms
		const fullPermOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.read.' + org));
		const intermediaryOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.intermediary.' + org));
		const orgs = fullPermOrgs.concat(intermediaryOrgs);
		if (!orgs.length) { return res.sendStatus(403); }

		const mayAccessSensitiveData = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.sensitive_data.' + org));

		const allCountries = await AKSO.db('countries')
			.select('code')
			.where('enabled', true)
			.pluck('code');

		const query = AKSO.db('pay_intents')
			.where(function () {
				this.whereIn('org', fullPermOrgs)
					.orWhere(function () {
						for (const org of intermediaryOrgs) {
							const countries = allCountries
								.filter(code => req.hasPermission(`pay.payment_intents.intermediary.${org}.${code}`));
							this.orWhere(function () {
								this.where('org', org)
									.whereIn('intermediaryCountryCode', countries);
							});
						}
					});
			});
		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: AKSOPayPaymentIntentResource,
			passToCol: [[ req, parSchema, mayAccessSensitiveData ]],
			afterQuery
		});
	}
};
