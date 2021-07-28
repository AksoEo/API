import path from 'path';

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
			required: [ 'name' ],
			additionalProperties: false
		},
		requirePerms: 'codeholder_roles.create'
	},

	run: async function run (req, res) {
		const id = (await AKSO.db('codeholderRoles').insert(req.body))[0];

		res.set('Location', path.join(AKSO.conf.http.path, '/codeholder_roles/', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
