export default {
	schema: {
		query: null,
		body: null,
		requirePerms: [
			'admin_groups.update',
			'clients.read'
		]
	},

	run: async function run (req, res) {
		// Make sure the admin group and the client exist
		const exists = await AKSO.db.raw(`
			SELECT 1 FROM clients WHERE apiKey = ? AND
			EXISTS(SELECT 1 FROM admin_groups WHERE id = ?)
		`, [ req.params.apiKey, req.params.adminGroupId ]);

		if (!exists) {
			return res.sendStatus(404);
		}

		const data = {
			adminGroupId: req.params.adminGroupId,
			apiKey: req.params.apiKey
		};

		// Check if the entry already exists
		const alreadyInserted = await AKSO.db('admin_groups_members_clients')
			.first(1)
			.where(data);

		if (!alreadyInserted) {
			await AKSO.db('admin_groups_members_clients')
				.insert(data);
		}

		res.sendStatus(204);
	}
};
