export default {
	schema: {
		query: null,
		body: null,
		requirePerms: [
			'clients.read',
			'clients.perms.update'
		]
	},

	run: async function run (req, res) {
		// Make sure the client exists
		const exists = await AKSO.db('clients')
			.where('apiKey', req.params.apiKey)
			.first(1);
		if (!exists) {
			return res.sendStatus(404);
		}

		const data = {
			apiKey: req.params.apiKey,
			permission: req.params.permission
		};

		// Check if the entry already exists
		const alreadyInserted = await AKSO.db('admin_permissions_clients')
			.first(1)
			.where(data);

		if (!alreadyInserted) {
			await AKSO.db('admin_permissions_clients')
				.insert(data);
		}

		res.sendStatus(204);
	}
};
