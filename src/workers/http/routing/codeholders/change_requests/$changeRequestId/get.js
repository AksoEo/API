import QueryUtil from 'akso/lib/query-util';
import CodeholderChangeRequestResource from 'akso/lib/resources/codeholder-change-request-resource';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: [
			'codeholders.read',
			'codeholders.change_requests.read',
		],
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('codeholders_changeRequests')
			.where('id', req.params.changeRequestId)
			.whereExists(function () {
				this.select(1)
					.from('view_codeholders')
					.whereRaw('view_codeholders.id = codeholders_changeRequests.codeholderId');
				memberFilter(codeholderSchema, this, req);
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CodeholderChangeRequestResource(row);
		res.sendObj(obj);
	}
};
