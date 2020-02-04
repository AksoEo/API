import { insertAsReplace } from 'akso/util';

import { handleMemberRestrictions } from 'akso/workers/http/routing/admin_groups/schema';

export default {
	schema: {
		body: {
			type: 'object',
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
		},
		requirePerms: [
			'clients.read', 'clients.perms.update'
		]
	},

	run: async function run (req, res) {
		handleMemberRestrictions(req.body);

		// Make sure the client exists
		const exists = await AKSO.db('clients')
			.first(1)
			.where('apiKey', req.params.apiKey);
		if (!exists) { return res.sendStatus(404); }

		// Set the restrictions
		await insertAsReplace(
			AKSO.db('admin_permissions_memberRestrictions_clients')
				.insert({
					apiKey: req.params.apiKey,
					filter: JSON.stringify(req.body.filter),
					fields: JSON.stringify(req.body.fields)
				}));

		res.sendStatus(204);
	}
};
