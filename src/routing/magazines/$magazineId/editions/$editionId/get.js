import QueryUtil from '../../../../../lib/query-util';
import MagazineEditionResource from '../../../../../lib/resources/magazine-edition-resource';

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
		try {
			const edition = new MagazineEditionResource(row);
			res.sendObj(edition);
		} catch (e) {
			if (e.simpleResourceError) { return res.sendStatus(404); }
			throw e;
		}
	}
};
