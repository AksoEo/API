import { schema as parSchema, getCodeholdersFromList } from './schema';

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

		res.sendObj(await getCodeholdersFromList(req.params.listId, req));
	}
};
