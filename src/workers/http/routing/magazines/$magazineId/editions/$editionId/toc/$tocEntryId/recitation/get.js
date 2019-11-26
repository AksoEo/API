import QueryUtil from 'akso/lib/query-util';
import MagazineRecitationFileMetadataResource from 'akso/lib/resources/magazine-recitation-file-metadata-resource';

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
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.read.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }
		
		// Make sure the toc entry exists
		const exists = await AKSO.db('magazines_editions_toc')
			.first(1)
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.tocEntryId
			});
		if (!exists) { return res.sendStatus(404); }

		const query = AKSO.db('magazines_editions_toc_recitations')
			.where({
				tocEntryId: req.params.tocEntryId
			});
		await QueryUtil.handleCollection({
			req,
			res,
			schema,
			query,
			afterQuery,
			Res: MagazineRecitationFileMetadataResource,
			passToCol: [[ req, schema ]],
		});
	}
};
