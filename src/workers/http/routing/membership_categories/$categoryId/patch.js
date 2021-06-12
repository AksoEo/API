export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				nameAbbrev: {
					type: 'string',
					minLength: 1,
					maxLength: 15,
					pattern: '^[^\\n]+$'
				},
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 50,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					maxLength: 2000
				},
				givesMembership: {
					type: 'boolean'
				},
				lifetime: {
					type: 'boolean'
				},
				availableFrom: {
					type: 'number',
					format: 'year',
					nullable: true
				},
				availableTo: {
					type: 'number',
					format: 'year',
					nullable: true
				}
			},
			minProperties: 1,
			additionalProperties: false
		},
		requirePerms: 'membership_categories.update'
	},

	run: async function run (req, res) {
		const updated = await AKSO.db('membershipCategories')
			.where('id', req.params.categoryId)
			.update(req.body);

		if (updated) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
