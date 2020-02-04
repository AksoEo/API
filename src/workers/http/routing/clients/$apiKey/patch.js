export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 200,
					pattern: '^[^\\n]+$'
				},
				ownerName: {
					type: 'string',
					minLength: 1,
					maxLength: 200,
					pattern: '^[^\\n]+$'
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
			.where('apiKey', req.params.apiKey)
			.update(req.body);

		if (updated) {
			res.sendStatus(204);
		} else {
			res.sendStatus(404);
		}
	}
};
