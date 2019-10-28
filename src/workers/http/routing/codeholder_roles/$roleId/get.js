import QueryUtil from '../../../../../lib/query-util';
import SimpleResource from '../../../../../lib/resources/simple-resource';

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
		try {
			const obj = new SimpleResource(row);
			res.sendObj(obj);
		} catch (e) {
			if (e.simpleResourceError) { return res.sendStatus(404); }
			throw e;
		}
	}
};
