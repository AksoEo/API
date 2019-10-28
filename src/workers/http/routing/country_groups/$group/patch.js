export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					pattern: '^[^\\n]+$',
					maxLength: 150
				}
			},
			additionalProperties: false,
			minProperties: 1
		},
		requirePerms: 'country_groups.update'
	},

	run: async function run (req, res) {
		const updated = await AKSO.db('countries_groups')
			.update({
				name: req.body.name
			})
			.where('code', req.params.group);

		if (updated) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
