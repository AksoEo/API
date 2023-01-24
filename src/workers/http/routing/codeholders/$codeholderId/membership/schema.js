export default {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		categoryId: 'f',
		year: 'f',
		nameAbbrev: 'f',
		name: 'f',
		description: '',
		givesMembership: 'f',
		lifetime: 'f',
		availableFrom: 'f',
		availableTo: 'f',
		canuto: 'f',
		isActive: 'f',
	},
	fieldAliases: {
		id: 'membershipCategories_codeholders.id',
		isActive: () => AKSO.db.raw('IF(lifetime, year <= :year, year = :year)', { year: (new Date()).getFullYear() }),
	}
};
