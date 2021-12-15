import path from 'path';

import AKSOOrganization from 'akso/lib/enums/akso-organization';
import { subscribersSchema, setDefaultsSubscribers, verifySubscribers } from './schema';

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
				},
				subscribers: subscribersSchema
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

		const data = { ...req.body };
		if ('subscribers' in data) {
			setDefaultsSubscribers(data.subscribers);
			verifySubscribers(data.subscribers);
		} else {
			data.subscribers = {
				access: false,
				paper: false,
			};
		}
		data.subscribers = JSON.stringify(data.subscribers);

		const id = (await AKSO.db('magazines').insert(data))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'magazines', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
