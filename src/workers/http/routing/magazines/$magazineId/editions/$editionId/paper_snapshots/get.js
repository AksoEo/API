import QueryUtil from 'akso/lib/query-util';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null
	},
	requirePerms: 'codeholders.read'
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const magazineOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('magazines.snapshots.read.' + org));
		if (!magazineOrgs.length) {
			res.type('text/plain').status(400)
				.send('Missing perm magazines.snapshots.read.<org>');
		}

		// Make sure the magazine edition exists
		const magazineExists = await AKSO.db('magazines_editions')
			.first(1)
			.where({
				magazineId: req.params.magazineId,
				id: req.params.editionId
			});
		if (!magazineExists) { return res.sendStatus(404); }

		const query = AKSO.db('magazines_paperAccessSnapshots')
			.where('editionId', req.params.editionId);
		await QueryUtil.handleCollection({
			req, res, schema, query
		});
	}
};
