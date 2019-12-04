import QueryUtil from 'akso/lib/query-util';
import AdminGroupResource from 'akso/lib/resources/admin-group-resource';

import { schema as parSchema } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'admin_groups.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('admin_groups')
			.leftJoin('admin_permissions_memberRestrictions_groups', 'id', 'adminGroupId');
		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: AdminGroupResource,
			passToCol: [[ req, schema ]]
		});
	}
};
