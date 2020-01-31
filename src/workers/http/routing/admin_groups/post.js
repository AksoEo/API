import path from 'path';

import { handleMemberRestrictions } from './schema';

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
				},
				memberRestrictions: {
					type: 'object',
					nullable: true,
					properties: {
						filter: {
							type: 'object'
						},
						fields: {
							type: 'object',
							nullable: true
						}
					},
					required: [
						'filter',
						'fields'
					],
					additionalProperties: false
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
		handleMemberRestrictions(req.body.memberRestrictions);

		const data = {...req.body};
		if ('memberRestrictions' in req.body) {
			delete data.memberRestrictions;
		}

		const id = (await AKSO.db('admin_groups').insert(data))[0];

		if (req.body.memberRestrictions) {
			await AKSO.db('admin_permissions_memberRestrictions_groups')
				.insert({
					adminGroupId: id,
					filter: JSON.stringify(req.body.memberRestrictions.filter),
					fields: req.body.memberRestrictions.fields ?
						JSON.stringify(req.body.memberRestrictions.fields) : null
				});
		}

		res.set('Location', path.join(AKSO.conf.http.path, '/admin_groups/', id.toString()));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
