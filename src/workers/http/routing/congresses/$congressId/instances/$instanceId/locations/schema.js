export default {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		name: 'fs',
		type: 'f',
		description: 's',
		address: '',
		ll: '',
		'rating.rating': '',
		'rating.max': '',
		'rating.type': '',
		icon: '',
		externalLoc: 'f'
	},
	fieldAliases: {
		'rating.rating': 'rating',
		'rating.max': 'rating_max',
		'rating.type': 'rating_type'
	}
};
