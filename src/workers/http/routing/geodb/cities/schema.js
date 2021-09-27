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
		'subdivision_eoLabel': 's'
	},
	fieldAliases: {
		id: 'cities.id'
	},
	alwaysWhere: query => {
		query.whereRaw('??.countries.enabled', AKSO.conf.mysql.database);
	},
	customSearch: {
		searchLabel: match => match('cities_labels.label')
	}
};
