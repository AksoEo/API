import path from 'path';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				org: {
					type: 'string',
					enum: [ 'uea' ] // Currently only UEA
				},
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 200,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 2000,
					nullable: true
				}
			},
			required: [
				'org',
				'name'
			],
			additionalProperties: false
		},
		requirePerms: 'delegations.subjects.create.uea' // Currently only UEA
	},

	run: async function run (req, res) {
		const id = (await AKSO.db('delegations_subjects').insert(req.body))[0];

		res.set('Location', path.join(AKSO.conf.http.path, '/delegations/subjects/', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
