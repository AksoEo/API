export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 2000,
					nullable: true
				},
				public: {
					type: 'boolean'
				}
			},
			minProperties: 1,
			additionalProperties: false
		},
		requirePerms: 'codeholder_roles.update'
	},

	run: async function run (req, res) {
		const updated = await AKSO.db('codeholderRoles')
			.where('id', req.params.roleId)
			.update(req.body);

		if (updated) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
