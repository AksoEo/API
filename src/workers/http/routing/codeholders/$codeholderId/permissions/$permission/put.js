import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: null,
		requirePerms: [
			'codeholders.read',
			'codeholders.perms.update'
		]
	},

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const data = {
			codeholderId: req.params.codeholderId,
			permission: req.params.permission
		};

		// Check if the entry already exists
		const alreadyInserted = await AKSO.db('admin_permissions_codeholders')
			.first(1)
			.where(data);

		if (!alreadyInserted) {
			await AKSO.db('admin_permissions_codeholders')
				.insert(data);
		}

		res.sendStatus(204);
	}
};
