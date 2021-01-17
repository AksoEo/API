import QueryUtil from 'akso/lib/query-util';
import RegistrationEntryResource from 'akso/lib/resources/registration-entry-resource';

import { schema as parSchema, afterQuery } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'registration.entries.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('registration_entries')
			.where('id', req.params.registrationEntryId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new RegistrationEntryResource(row, req, schema);
		res.sendObj(obj);
	}
};
