import AKSOOrganization from 'akso/lib/enums/akso-organization';
import QueryUtil from 'akso/lib/query-util';

import schema from './schema';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		...schema,
		query: 'collection',
		body: null,
		requirePerms: [
			'codeholders.read',
		],
	},

	run: async function run (req, res) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const permittedOrgs = AKSOOrganization.allLower
			.filter(org => req.hasPermission('congress_instances.participants.read.' + org));
		if (!permittedOrgs.length) {
			const err = new Error('Missing perm congresses_instances.participants.read.<org>');
			err.statusCode = 403;
			throw err;
		}

		const query = AKSO.db('view_congresses_instances_participants')
			.innerJoin('congresses_instances', 'congresses_instances.id', 'view_congresses_instances_participants.congressInstanceId')
			.innerJoin('congresses', 'congresses.id', 'congresses_instances.congressId')
			.where({
				codeholderId: req.params.codeholderId,
			})
			.whereIn('org', permittedOrgs);
		await QueryUtil.handleCollection({
			req, res, schema, query,
		});
	}
};
