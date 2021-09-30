export default {
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'country': 'f',
		'population': 'f',
		'nativeLabel': 's',
		'eoLabel': 's',
		'll': '',
		'subdivision_nativeLabel': 's',
		'subdivision_eoLabel': 's',
		'subdivision_iso': 'f'
	},
	fieldAliases: {
		id: 'cities.id',
		ll: 'cities_ll.ll'
	},
	alwaysWhere: query => {
		query.whereRaw('??.countries.enabled', AKSO.conf.mysql.database);
	},
	customSearch: {
		searchLabel: match => match('cities_labels.label')
	}
};
