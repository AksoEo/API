import QueryUtil from 'akso/lib/query-util';
import RegistrationEntryResource from 'akso/lib/resources/registration-entry-resource';

import { schema as parSchema, afterQuery } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: [
			'codeholders.read',
		],
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId);
		QueryUtil.simpleResource(req, schema, query);

		// Check perms
		let access = true;
		if (!req.hasPermission('registration.entries.read')) {
			const allCountries = await AKSO.db('countries')
				.select('code')
				.where('enabled', true)
				.pluck('code');

			access = allCountries
				.filter(x => req.hasPermission('registration.entries.intermediary.' + x));

			if (!access.length) {
				return res.sendStatus(403);
			}
		}
		if (Array.isArray(access)) {
			query.whereIn('intermediary', access);
		}

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new RegistrationEntryResource(row, req, schema);
		res.sendObj(obj);
	}
};
