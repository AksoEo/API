import path from 'path';

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
					maxLength: 2000,
					default: ''
				},
				givesMembership: {
					type: 'boolean',
					default: false
				},
				lifetime: {
					type: 'boolean',
					default: false
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
			required: [ 'nameAbbrev', 'name' ],
			additionalProperties: false
		},
		requirePerms: 'membership_categories.create'
	},

	run: async function run (req, res) {
		const id = (await AKSO.db('membershipCategories').insert(req.body))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'membership_categories', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
