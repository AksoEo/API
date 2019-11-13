import QueryUtil from 'akso/lib/query-util';
import MagazineEditionFileMetadataResource from 'akso/lib/resources/magazine-edition-file-metadata-resource';

import { schema as parSchema, afterQuery } from './schema';

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
		// Make sure the edition exists
		const editionExists = await AKSO.db('magazines_editions')
			.first(1)
			.where({
				id: req.params.editionId,
				magazineId: req.params.magazineId
			});
		if (!editionExists) { return res.sendStatus(404); }

		const query = AKSO.db('magazines_editions_files')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId
			});
		await QueryUtil.handleCollection({
			req,
			res,
			schema,
			query,
			afterQuery,
			Res: MagazineEditionFileMetadataResource,
			passToCol: [[ req, schema ]],
		});
	}
};
