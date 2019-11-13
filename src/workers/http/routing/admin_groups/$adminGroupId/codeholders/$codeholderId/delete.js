import { schema as parSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: null,
		requirePerms: [
			'admin_groups.update',
			'codeholders.read'
		]
	},

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }
		
		const deleted = await AKSO.db('admin_groups_members_codeholders')
			.where({
				adminGroupId: req.params.adminGroupId,
				codeholderId: req.params.codeholderId
			})
			.delete();

		if (deleted) {
			res.sendStatus(204);
		} else {
			res.sendStatus(404);
		}
	}
};
