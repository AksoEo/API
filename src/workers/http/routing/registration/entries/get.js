import QueryUtil from 'akso/lib/query-util';
import RegistrationEntryResource from 'akso/lib/resources/registration-entry-resource';

import { schema as parSchema, afterQuery } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'registration.entries.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('registration_entries');

		await QueryUtil.handleCollection({
			req, res, schema, query, afterQuery,
			Res: RegistrationEntryResource,
			passToCol: [[ req, schema ]]
		});
	}
};
