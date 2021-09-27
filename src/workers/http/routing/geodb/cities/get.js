import QueryUtil from 'akso/lib/query-util';
import GeoDBCityResource from 'akso/lib/resources/geodb-city-resource';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'geodb.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.geodb('cities')
			.innerJoin('cities_labels', 'cities_labels.id', 'cities.id')
			.joinRaw('INNER JOIN ??.countries ON ??.countries.code = cities.country', [
				AKSO.conf.mysql.database,
				AKSO.conf.mysql.database
			])
			.leftJoin('cities_ll', 'cities_ll.id', 'cities.id')
			.groupBy('cities.id');

		await QueryUtil.handleCollection({
			db: AKSO.geodb, req, res, schema, query,
			doMetaData: false,
			Res: GeoDBCityResource
		});
	}
};
