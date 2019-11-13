import QueryUtil from 'akso/lib/query-util';
import MembershipCategoryResource from 'akso/lib/resources/membership-category-resource';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'membership_categories.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('membershipCategories');
		await QueryUtil.handleCollection({ req, res, schema, query, Res: MembershipCategoryResource });
	}
};
