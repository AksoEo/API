export default {
	schema: {
		query: null,
		body: {
			properties: {
				category: {
					type: 'string',
					minLength: 1,
					maxLength: 15,
					pattern: '^[^\\n]+$'
				},
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$'
				},
				description: {
					oneOf: [
						{
							type: 'null'
						},
						{
							type: 'string',
							minLength: 1,
							maxLength: 1000
						}
					]
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
