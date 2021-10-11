import { schema as parSchema, getCodeholderQuery } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'lists.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const bannedQuery = [
			'filter', 'fields', 'search', 'order'
		];

		for (const bannedQueryBit of bannedQuery) {
			if (bannedQueryBit in req.query) {
				return res.status(400).type('text/plain').send(`?${bannedQueryBit} is not allowed in query`);
			}
		}

		const query = (await getCodeholderQuery(req.params.listId, req)).query;
		const codeholders = (await query)
			.map(x => x.id);

		res.sendObj(codeholders);
	}
};
