import { insertAsReplace } from 'akso/util';

import { handleMemberRestrictions } from '../schema';

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
			minProperties: 1,
			additionalProperties: false
		},
		requirePerms: 'admin_groups.update'
	},

	run: async function run (req, res) {
		handleMemberRestrictions(req.body.memberRestrictions);

		// Make sure the admin group exists
		const exists = await AKSO.db('admin_groups')
			.where('id', req.params.adminGroupId)
			.first(1);
		if (!exists) { return res.sendStatus(404); }

		const data = {...req.body};
		if ('memberRestrictions' in req.body) {
			delete data.memberRestrictions;
		}

		if (Object.keys(data).length) {
			await AKSO.db('admin_groups')
				.where('id', req.params.adminGroupId)
				.update(data);
		}

		if ('memberRestrictions' in req.body) {
			if (req.body.memberRestrictions === null) {
				await AKSO.db('admin_permissions_memberRestrictions_groups')
					.where('adminGroupId', req.params.adminGroupId)
					.delete();
			} else {
				await insertAsReplace(AKSO.db('admin_permissions_memberRestrictions_groups')
					.insert({
						adminGroupId: req.params.adminGroupId,
						filter: JSON.stringify(req.body.memberRestrictions.filter),
						fields: req.body.memberRestrictions.fields ?
							JSON.stringify(req.body.memberRestrictions.fields) : null
					}));
			}
		}

		res.sendStatus(204);
	}
};
