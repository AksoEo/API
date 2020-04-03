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
					maxLength: 15,
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
				'org',
				'name'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		const orgPerm = 'pay.payment_orgs.create.' + req.body.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const id = (await AKSO.db('pay_orgs').insert(req.body))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'aksopay/payment_orgs', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
