import QueryUtil from '../../../../../../../../lib/query-util';
import MagazineEditionToCResource from '../../../../../../../../lib/resources/magazine-edition-toc-resource';

import parSchema from './schema';

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
		const editionExists = await AKSO.db('magazines_editions')
			.first(1)
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			});
		if (!editionExists) { return res.sendStatus(404); }

		const query = AKSO.db('magazines_editions_toc')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId
			});
		await QueryUtil.handleCollection({ req, res, schema, query, Res: MagazineEditionToCResource });
	}
};
