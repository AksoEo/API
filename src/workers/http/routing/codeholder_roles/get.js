import QueryUtil from 'akso/lib/query-util';
import CodeholderRoleResource from 'akso/lib/resources/codeholder-role-resource';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'codeholder_roles.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('codeholderRoles');
		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: CodeholderRoleResource
		});
	}
};
