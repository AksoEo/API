import QueryUtil from '../../../../../lib/query-util';
import MembershipCategoryResource from '../../../../../lib/resources/membership-category-resource';

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
		try {
			const obj = new MembershipCategoryResource(row);
			res.sendObj(obj);
		} catch (e) {
			if (e.simpleResourceError) { return res.sendStatus(404); }
			throw e;
		}
	}
};
