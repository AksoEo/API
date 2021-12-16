import QueryUtil from 'akso/lib/query-util';
import MagazineResource from 'akso/lib/resources/magazine-resource';

import { schema as parSchema } from '../schema';

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
		const query = AKSO.db('magazines');
		QueryUtil.simpleResource(req, schema, query);
		query.where('id', req.params.magazineId);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new MagazineResource(row, req, parSchema);
		res.sendObj(obj);
	}
};
