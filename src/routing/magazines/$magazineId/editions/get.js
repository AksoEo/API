import QueryUtil from '../../../../lib/query-util';
import MagazineEditionResource from '../../../../lib/resources/magazine-edition-resource';

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
		// Make sure the magazine exists
		const magazineExists = await AKSO.db('magazines')
			.first(1)
			.where('id', req.params.magazineId);
		if (!magazineExists) { return res.sendStatus(404); }

		const query = AKSO.db('magazines_editions')
			.where('magazineId', req.params.magazineId);
		await QueryUtil.handleCollection({ req, res, schema, query, Res: MagazineEditionResource });
	}
};
