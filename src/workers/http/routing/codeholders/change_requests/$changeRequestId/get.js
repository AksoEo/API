import QueryUtil from 'akso/lib/query-util';
import CodeholderChangeRequestResource from 'akso/lib/resources/codeholder-change-request-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'codeholders.change_requests.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('codeholders_changeRequests')
			.where('id', req.params.changeRequestId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CodeholderChangeRequestResource(row);
		res.sendObj(obj);
	}
};
