import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
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
		
		const orgPerm = 'magazines.snapshots.update.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const deleted = await AKSO.db('magazines_paperAccessSnapshots')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.snapshotId
			})
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
