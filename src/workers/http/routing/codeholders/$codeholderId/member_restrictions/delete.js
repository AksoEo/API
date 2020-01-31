import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import { handleMemberRestrictions } from 'akso/workers/http/routing/admin_groups/schema';

export default {
	schema: {
		requirePerms: [
			'codeholders.read', 'codeholders.perms.update'
		]
	},

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		handleMemberRestrictions(req.body);

		const deleted = await AKSO.db('admin_permissions_memberRestrictions_codeholders')
			.where('codeholderId', req.params.codeholderId)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
