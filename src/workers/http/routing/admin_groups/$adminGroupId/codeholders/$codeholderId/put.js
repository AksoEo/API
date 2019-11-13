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
		// Make sure the admin group exists
		const adminGroupExists = await AKSO.db.raw('SELECT 1 FROM admin_groups WHERE id = ?',
			req.params.adminGroupId);

		if (!adminGroupExists) {
			return res.sendStatus(404);
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const data = {
			adminGroupId: req.params.adminGroupId,
			codeholderId: req.params.codeholderId
		};

		// Check if the entry already exists
		const alreadyInserted = await AKSO.db('admin_groups_members_codeholders')
			.first(1)
			.where(data);

		if (!alreadyInserted) {
			await AKSO.db('admin_groups_members_codeholders')
				.insert(data);
		}

		res.sendStatus(204);
	}
};
