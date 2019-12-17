import path from 'path';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				code: {
					type: 'string',
					pattern: '^x[a-z]{2}$'
				},
				name: {
					type: 'string',
					pattern: '^[^\\n]+$',
					maxLength: 150
				}
			},
			additionalProperties: false,
			required: [ 'code', 'name' ]
		},
		requirePerms: 'country_groups.create'
	},

	run: async function run (req, res) {
		const exists = await AKSO.db('countries_groups')
			.where('code', req.body.code)
			.first(1);

		if (exists) { return res.sendStatus(409); }

		await AKSO.db('countries_groups').insert({
			code: req.body.code,
			name: req.body.name
		});

		res.set('Location', path.join(AKSO.conf.http.path, 'country_groups', req.body.code));
		res.set('X-Identifier', req.body.code);
		res.sendStatus(201);
	}
};
