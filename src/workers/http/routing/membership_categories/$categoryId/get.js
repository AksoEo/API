import QueryUtil from 'akso/lib/query-util';
import MembershipCategoryResource from 'akso/lib/resources/membership-category-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'membership_categories.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('membershipCategories');
		QueryUtil.simpleResource(req, schema, query);
		query.where('id', req.params.categoryId);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new MembershipCategoryResource(row);
		res.sendObj(obj);
	}
};
