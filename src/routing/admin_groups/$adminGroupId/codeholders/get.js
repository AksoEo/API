import QueryUtil from '../../../../lib/query-util';
import CodeholderResource from '../../../../lib/resources/codeholder-resource';

import { schema as parSchema, memberFilter, memberFields, afterQuery } from '../../../codeholders/schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: [
			'admin_groups.read',
			'codeholders.read'
		]
	}
};
schema.alwaysWhere = (query, req) => memberFilter(schema, query, req);

export default {
	schema: schema,

	run: async function run (req, res) {
		// Restrictions
		if (!memberFields(schema, req, res, 'r')) { return; }

		const query = AKSO.db('view_codeholders')
			.innerJoin('admin_groups_members_codeholders', 'admin_groups_members_codeholders.codeholderId', 'id')
			.where('adminGroupId', req.params.adminGroupId);

		let fieldWhitelist = null;
		if (req.memberFields) { fieldWhitelist = Object.keys(req.memberFields); }

		await QueryUtil.handleCollection({
			req,
			res,
			schema,
			query,
			Res: CodeholderResource,
			passToCol: [[ req, schema ]],
			fieldWhitelist,
			afterQuery
		});
	}
};
