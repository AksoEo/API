export default {
	defaultFields: [ 'code' ],
	fields: {
		'code': 'f',
		'name': 'fs',
		'countries': ''
	},
	fieldAliases: {
		// GROUP_CONCAT has a max output size of 1024 bytes. This means we can have ~340 countries in one group which is fine for what we're doing
		'countries': () => AKSO.db.raw('group_concat(country_code) as countries')
	}
};
