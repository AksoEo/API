import QueryUtil from 'akso/lib/query-util';
import GeoDBCityResource from 'akso/lib/resources/geodb-city-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'geodb.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.geodb('cities')
			.leftJoin('cities_ll', 'cities_ll.id', 'cities.id')
			.where('cities.id', req.params.cityId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new GeoDBCityResource(row);
		res.sendObj(obj);
	}
};
