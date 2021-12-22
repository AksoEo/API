import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					nullable: true,
					minLength: 1,
					maxLength: 255,
					pattern: '^[^\\n]+$'
				}
			},
			additionalProperties: false,
			minProperties: 1,
		}
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

		const updated = await AKSO.db('magazines_paperAccessSnapshots')
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.snapshotId
			})
			.update(req.body);

		res.sendStatus(updated ? 204 : 404);
	}
};
