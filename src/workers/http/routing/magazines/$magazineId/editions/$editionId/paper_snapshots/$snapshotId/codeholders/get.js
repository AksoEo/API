import QueryUtil from 'akso/lib/query-util';
import PrimitiveResource from 'akso/lib/resources/primitive-resource';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: [ 'limit', 'offset', 'compare' ],
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

		// Make sure the snapshot exists
		const snapshotExists = AKSO.db('magazines_paperAccessSnapshots')
			.first(1)
			.where({
				magazineId: req.params.magazineId,
				editionId: req.params.editionId,
				id: req.params.snapshotId
			});
		if (!snapshotExists) { return res.sendStatus(404); }

		// Verify ?compare
		let compareSnapshot = null;
		if (req.query.compare) {
			compareSnapshot = parseInt(req.query.compare, 10);
			if (isNaN(compareSnapshot)) {
				return res.type('text/plain').status(400)
					.send('Non-integer value in ?compare');
			}
			const compareSnapshotExists = await AKSO.db('magazines_paperAccessSnapshots')
				.first(1)
				.where({
					magazineId: req.params.magazineId,
					editionId: req.params.editionId,
					id: compareSnapshot
				});
			if (!compareSnapshotExists) {
				return res.type('text/plain').status(400)
					.send('Unknown snapshot in ?compare. Make sure it is for the same edition and that it exists.');
			}
		}

		const query = AKSO.db('magazines_paperAccessSnapshots_codeholders')
			.where('snapshotId', req.params.snapshotId);

		if (compareSnapshot !== null) {
			query.whereNotExists(function () {
				this.select(1)
					.from(AKSO.db.raw('magazines_paperAccessSnapshots_codeholders c'))
					.where('c.snapshotId', compareSnapshot)
					.whereRaw('`c`.`codeholderId` = `magazines_paperAccessSnapshots_codeholders`.`codeholderId`');
			});
		}

		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: PrimitiveResource,
			passToCol: [['codeholderId']]
		});
	}
};
