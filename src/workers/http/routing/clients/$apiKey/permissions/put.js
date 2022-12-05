export default {
	schema: {
		query: null,
		body: {
			type: 'array',
			maxItems: 1023,
			items: {
				type: 'string',
				pattern: '^(\\w+(\\.\\w+)*(\\.\\*)?)|\\*$'
			}
		},
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

		// Remove duplicates
		const data = [...new Set(req.body)].map(perm => {
			return { apiKey: req.params.apiKey, permission: perm };
		});

		const trx = await req.createTransaction();

		await trx('admin_permissions_clients')
			.where('apiKey', req.params.apiKey)
			.delete();

		if (data.length) {
			await trx('admin_permissions_clients')
				.insert(data);
		}

		await trx.commit();

		res.sendStatus(204);
	}
};
