import QueryUtil from 'akso/lib/query-util';
import AdminGroupResource from 'akso/lib/resources/admin-group-resource';

import { schema as parSchema } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'admin_groups.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('admin_groups')
			.leftJoin('admin_permissions_memberRestrictions_groups', 'id', 'adminGroupId');

		QueryUtil.simpleResource(req, schema, query);
		query.where('id', req.params.adminGroupId);
		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new AdminGroupResource(row, req, schema);
		res.sendObj(obj);
	}
};
