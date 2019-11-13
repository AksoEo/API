import QueryUtil from 'akso/lib/query-util';
import CodeholderMembershipResource from 'akso/lib/resources/codeholder-membership-resource';

import { schema as codeholderSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';
import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'codeholders.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'id',
			'membership'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const query = AKSO.db('membershipCategories_codeholders')
			.innerJoin('membershipCategories', 'membershipCategories.id', 'membershipCategories_codeholders.categoryId')
			.where({
				'membershipCategories_codeholders.id': req.params.membershipId,
				'codeholderId': req.params.codeholderId
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CodeholderMembershipResource(row);
		res.sendObj(obj);
	}
};
