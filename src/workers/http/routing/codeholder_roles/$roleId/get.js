import QueryUtil from 'akso/lib/query-util';
import CodeholderRoleResource from 'akso/lib/resources/codeholder-role-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'codeholder_roles.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('codeholderRoles');
		QueryUtil.simpleResource(req, schema, query);
		query.where('id', req.params.roleId);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CodeholderRoleResource(row);
		res.sendObj(obj);
	}
};
