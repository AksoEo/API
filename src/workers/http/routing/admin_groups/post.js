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
			required: [
				'name'
			],
			additionalProperties: false
		},
		requirePerms: 'admin_groups.create'
	},

	run: async function run (req, res) {
		const id = (await AKSO.db('admin_groups').insert(req.body))[0];

		res.set('Location', path.join(AKSO.conf.http.path, '/admin_groups/', id.toString()));
		res.sendStatus(201);
	}
};
