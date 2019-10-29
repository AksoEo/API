import QueryUtil from '../../../../../../../../../lib/query-util';
import MagazineEditionToCResource from '../../../../../../../../../lib/resources/magazine-edition-toc-resource';

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
		const query = AKSO.db('magazines_editions_toc')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.tocEntryId
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new MagazineEditionToCResource(row);
		res.sendObj(obj);
	}
};
