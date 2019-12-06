import QueryUtil from 'akso/lib/query-util';
import AdminGroupResource from 'akso/lib/resources/admin-group-resource';

import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';
import { schema as parSchema } from 'akso/workers/http/routing/admin_groups/schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: [
			'codeholders.read',
			'admin_groups.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const query = AKSO.db('admin_groups')
			.innerJoin('admin_groups_members_codeholders', 'id', 'admin_groups_members_codeholders.adminGroupId')
			.leftJoin('admin_permissions_memberRestrictions_groups', 'id', 'admin_permissions_memberRestrictions_groups.adminGroupId')
			.where('codeholderId', req.params.codeholderId);
		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: AdminGroupResource,
			passToCol: [[ req, schema ]]
		});
	}
};
