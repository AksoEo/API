import { schema as parSchema, getCodeholderQuery, handleCodeholders } from './schema';

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
		if ('filter' in req.query) {
			return res.status(400).type('text/plain').send('?filter is not allowed');
		}
		if ('search' in req.query) {
			return res.status(400).type('text/plain').send('?search is not allowed');
		}
		if ('order' in req.query) {
			return res.status(400).type('text/plain').send('?order is not allowed');
		}

		const query = (await getCodeholderQuery(req.params.listId, req)).query;
		const codeholders = await handleCodeholders(req, await query);

		const totalItemsQueryBase = query
			.clone()
			.limit(Number.MAX_SAFE_INTEGER)
			.offset(0);
		const totalItemsQuery = AKSO.db
			.first(AKSO.db.raw('count(1) as `count`'))
			.from(AKSO.db.raw(`(${totalItemsQueryBase.toString()}) base`));
		const totalItems = (await totalItemsQuery).count;

		res.set('X-Total-Items', totalItems);
		res.set('X-Total-Items-No-Filter', totalItems);

		res.sendObj(codeholders);
	}
};
