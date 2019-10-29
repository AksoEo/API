import QueryUtil from '../../../../../../../lib/query-util';
import CodeholderMembershipResource from '../../../../../../../lib/resources/codeholder-membership-resource';

import { memberFieldsManual } from '../../../schema';
import parSchema from '../../../$codeholderId/membership/schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
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
			.where({
				'membershipCategories_codeholders.id': req.params.membershipId,
				'codeholderId': req.user.user
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CodeholderMembershipResource(row);
		res.sendObj(obj);
	}
};
