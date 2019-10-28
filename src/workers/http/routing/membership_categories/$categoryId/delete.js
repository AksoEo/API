import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: null,
		requirePerms: 'membership_categories.delete'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const deleted = await AKSO.db('membershipCategories')
			.where('id', req.params.categoryId)
			.delete();

		if (deleted) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
