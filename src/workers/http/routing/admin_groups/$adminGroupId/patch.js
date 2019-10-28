export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 255,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 1000,
					nullable: true
				}
			},
			minProperties: 1,
			additionalProperties: false
		},
		requirePerms: 'admin_groups.update'
	},

	run: async function run (req, res) {
		const updated = await AKSO.db('admin_groups')
			.where('id', req.params.adminGroupId)
			.update(req.body);

		if (updated) {
			res.sendStatus(204);
		} else {
			res.sendStatus(404);
		}
	}
};
