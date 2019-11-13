import QueryUtil from 'akso/lib/query-util';

import { schema as parSchema } from '../locations/schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		alwaysSelect: []
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		if ('limit' in req.query) {
			return res.status(400).type('text/plain').send('?limit is not allowed');
		}
		if ('offset' in req.query) {
			return res.status(400).type('text/plain').send('?offset is not allowed');
		}
		if ('fields' in req.query) {
			return res.status(400).type('text/plain').send('?fields is not allowed');
		}

		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.read.' + orgData.org)) { return res.sendStatus(403); }

		const query = AKSO.db('congresses_instances_locations')
			.leftJoin('congresses_instances_locations_internal', 'id', 'congresses_instances_locations_internal.congressInstanceLocationId')
			.leftJoin('congresses_instances_locations_external', 'id', 'congresses_instances_locations_external.congressInstanceLocationId')
			.leftJoin('congresses_instances_locations_external_rating', 'id', 'congresses_instances_locations_external_rating.congressInstanceLocationId')
			.where('congressInstanceId', req.params.instanceId);
		QueryUtil.simpleCollection(req, schema, query);
		query.clearSelect();
		query.first(
			AKSO.db.raw('MIN(ST_X(ll)) as `minX`'),
			AKSO.db.raw('MIN(ST_Y(ll)) as `minY`'),
			AKSO.db.raw('MAX(ST_X(ll)) as `maxX`'),
			AKSO.db.raw('MAX(ST_Y(ll)) as `maxY`')
		);

		const mapData = await query;
		if (!mapData || mapData.minX === null) { return res.sendStatus(404); }

		res.sendObj({
			boundSW: [
				mapData.minX,
				mapData.minY
			],
			boundNE: [
				mapData.maxX,
				mapData.maxY
			]
		});
	}
};
