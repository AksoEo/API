import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		requirePerms: [
			'codeholders.read', 'codeholders.perms.read'
		]
	},

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const memberRestrictions = await AKSO.db('admin_permissions_memberRestrictions_codeholders')
			.first('filter', 'fields')
			.where('codeholderId', req.params.codeholderId);

		if (!memberRestrictions) { return res.sendStatus(404); }

		res.sendObj(memberRestrictions);
	}
};
