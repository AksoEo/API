import path from 'path';

import AKSOOrganization from 'akso/lib/enums/akso-organization';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				org: {
					type: 'string',
					enum: AKSOOrganization.allLower,
				},
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
			required: [
				'org',
				'name'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		const orgPerm = 'newsletters.' + req.body.org + '.create';
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const id = (await AKSO.db('newsletters').insert(req.body))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'newsletters', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
