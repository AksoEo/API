import QueryUtil from 'akso/lib/query-util';
import OrgListResource from 'akso/lib/resources/org-list-resource';

import { schema as parSchema, afterQuery }  from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		requirePerms: [
			'org_lists.read',
			'codeholders.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('orgLists');
		await QueryUtil.handleCollection({
			req, res, schema, query, Res: OrgListResource,
			passToCol: [[req, schema]], afterQuery
		});
	}
};
