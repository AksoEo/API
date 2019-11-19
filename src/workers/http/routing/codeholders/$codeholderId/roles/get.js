import QueryUtil from 'akso/lib/query-util';
import CodeholderRoleEntryResource from 'akso/lib/resources/codeholder-role-entry-resource';

import { schema as codeholderSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';
import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: [
			'codeholders.read',
			'codeholder_roles.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'id',
			'roles'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(403).type('text/plain').send('Missing permitted roles codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const query = AKSO.db('codeholderRoles_codeholders')
			.innerJoin('codeholderRoles', 'codeholderRoles.id', 'codeholderRoles_codeholders.roleId')
			.where('codeholderId', req.params.codeholderId);

		await QueryUtil.handleCollection({
			req, res, schema, query, Res: CodeholderRoleEntryResource
		});
	}
};
