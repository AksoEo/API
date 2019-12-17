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
					enum: AKSOOrganization.allLower.filter(x => x !== 'akso')
				},
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 50,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				},
				issn: {
					type: 'string',
					pattern: '^\\d{8}$',
					nullable: true
				}
			},
			required: [
				'org',
				'name'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		const orgPerm = 'magazines.create.' + req.body.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const id = (await AKSO.db('magazines').insert(req.body))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'magazines', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
