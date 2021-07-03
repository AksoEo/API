import QueryUtil from 'akso/lib/query-util';
import CodeholderChangeRequestResource from 'akso/lib/resources/codeholder-change-request-resource';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'codeholders.change_requests.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('codeholders_changeRequests');
		await QueryUtil.handleCollection({ req, res, schema, query, Res: CodeholderChangeRequestResource });
	}
};
