export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 60,
					pattern: '^[^\\n]+$',
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 200,
					pattern: '^[^\\n]+$',
					nullable: true,
				},
				public: {
					type: 'boolean',
				},
			},
			additionalProperties: false,
			minProperties: 1,
		}
	},

	run: async function run (req, res) {
		const newsletter = await AKSO.db('newsletters')
			.first('org')
			.where('id', req.params.newsletterId);
		if (!newsletter) { return res.sendStatus(404); }
		
		const orgPerm = 'newsletters.' + newsletter.org + '.update';
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		await AKSO.db('newsletters')
			.where('id', req.params.newsletterId)
			.update(req.body);

		res.sendStatus(204);
	}
};
