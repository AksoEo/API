import parSchema from 'akso/workers/http/routing/codeholders/$codeholderId/delegations/schema';

export default {
	defaultFields: [ 'codeholderId' ],
	fields: {
		codeholderId: 'f',
		org: 'f',
		approvedBy: 'f',
		approvedTime: 'f',
		cities: '',
		countries: '',
		subjects: '',
		'hosting.maxDays': 'f',
		'hosting.maxPersons': 'f',
		'hosting.description': 's',
		'hosting.psProfileURL': '',
		tos: ''
	},
	fieldAliases: {
		cities: () => AKSO.db.raw('1'),
		countries: () => AKSO.db.raw('1'),
		subjects: () => AKSO.db.raw('1'),
		'hosting.maxDays': () => AKSO.db.raw('1'),
		'hosting.maxPersons': () => AKSO.db.raw('1'),
		'hosting.description': () => AKSO.db.raw('1'),
		'hosting.psProfileURL': () => AKSO.db.raw('1'),
		tos: () => AKSO.db.raw('1')
	},
	alwaysSelect: [
		...parSchema.alwaysSelect
	],
	afterQuery: parSchema.afterQuery
};
