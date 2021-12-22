import QueryUtil from 'akso/lib/query-util';
import SimpleResource from 'akso/lib/resources/simple-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null
	},
	requirePerms: 'codeholders.read'
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.snapshots.read.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const query = AKSO.db('magazines_paperAccessSnapshots')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.snapshotId
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new SimpleResource(row, req, schema);
		res.sendObj(obj);
	}
};
