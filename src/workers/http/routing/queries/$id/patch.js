export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				category: {
					type: 'string',
					minLength: 1,
					maxLength: 63,
					pattern: '^[^\\n]+$'
				},
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 1000,
					nullable: true
				},
				query: {
					type: 'object'
				}
			},
			additionalProperties: false,
			minProperties: 1
		},
		requirePerms: 'queries.update'
	},

	run: async function run (req, res) {
		const updated = await AKSO.db('savedQueries')
			.where('id', req.params.id)
			.update({
				category: req.body.category,
				name: req.body.name,
				description: req.body.description,
				query: JSON.stringify(req.body.query)
			});

		if (updated) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
