import QueryUtil from '../../../../../../../lib/query-util';
import MagazineEditionResource from '../../../../../../../lib/resources/magazine-edition-resource';

import parSchema from '../schema';

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
		const query = AKSO.db('magazines_editions');
		QueryUtil.simpleResource(req, schema, query);
		query.where({
			id: req.params.editionId,
			magazineId: req.params.magazineId
		});

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new MagazineEditionResource(row);
		res.sendObj(obj);
	}
};
