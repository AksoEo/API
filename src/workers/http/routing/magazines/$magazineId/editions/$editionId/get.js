import QueryUtil from 'akso/lib/query-util';
import MagazineEditionResource from 'akso/lib/resources/magazine-edition-resource';

import { schema as parSchema, afterQuery } from '../schema';

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
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.read.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }
		
		const query = AKSO.db('magazines_editions');
		QueryUtil.simpleResource(req, schema, query);
		query.where({
			id: req.params.editionId,
			magazineId: req.params.magazineId
		});

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		await new Promise(resolve => afterQuery([row], resolve));
		const obj = new MagazineEditionResource(row, req, schema);
		res.sendObj(obj);
	}
};
