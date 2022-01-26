import QueryUtil from 'akso/lib/query-util';
import OrgListResource from 'akso/lib/resources/org-list-resource';

import { schema as parSchema, afterQuery } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		requirePerms: [
			'org_lists.read',
			'codeholders.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('orgLists')
			.where('name', req.params.listName);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new OrgListResource(row, req, schema);
		res.sendObj(obj);
	}
};
