import { insertAsReplace } from 'akso/util';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

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
			'codeholders.read', 'codeholders.perms.update'
		]
	},

	run: async function run (req, res) {
		handleMemberRestrictions(req.body);

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		// Set the restrictions
		await insertAsReplace(
			AKSO.db('admin_permissions_memberRestrictions_codeholders')
				.insert({
					codeholderId: req.params.codeholderId,
					filter: JSON.stringify(req.body.filter),
					fields: JSON.stringify(req.body.fields)
				}));

		res.sendStatus(204);
	}
};
