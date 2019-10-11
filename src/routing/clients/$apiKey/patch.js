export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 200
				},
				ownerName: {
					type: 'string',
					minLength: 1,
					maxLength: 200
				},
				ownerEmail: {
					type: 'string',
					format: 'email',
					minLength: 1,
					maxLength: 200
				}
			},
			minProperties: 1,
			additionalProperties: false
		},
		requirePerms: 'clients.update'
	},

	run: async function run (req, res) {
		const updated = await AKSO.db('clients')
			.where('apiKey', Buffer.from(req.params.apiKey, 'hex'))
			.update(req.body);

		if (updated) {
			res.sendStatus(204);
		} else {
			res.sendStatus(404);
		}
	}
};
