import QueryUtil from 'akso/lib/query-util';
import CodeholderMembershipResource from 'akso/lib/resources/codeholder-membership-resource';

import { memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';
import parSchema from 'akso/workers/http/routing/codeholders/$codeholderId/membership/schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null
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
		if (!memberFieldsManual(requiredMemberFields, req, 'r', req.ownMemberFields)) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		const query = AKSO.db('membershipCategories_codeholders')
			.innerJoin('membershipCategories', 'membershipCategories.id', 'membershipCategories_codeholders.categoryId')
			.where('codeholderId', req.user.user);

		await QueryUtil.handleCollection({ req, res, schema, query, Res: CodeholderMembershipResource });
	}
};
