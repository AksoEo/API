import QueryUtil from 'akso/lib/query-util';

import parSchema from 'akso/workers/http/routing/codeholders/$codeholderId/delegations/schema';

export default {
	defaultFields: [ 'codeholderId' ],
	fields: {
		codeholderId: 'f',
		org: 'f',
		approvedBy: 'f',
		approvedTime: 'f',
		cities: '',
		cityCountries: '',
		countries: '',
		subjects: '',
		'hosting.maxDays': 'f',
		'hosting.maxPersons': 'f',
		'hosting.description': 's',
		'hosting.psProfileURL': '',
		'tos.docDataProtectionUEA': '',
		'tos.docDataProtectionUEATime': 'f',
		'tos.docDelegatesUEA': '',
		'tos.docDelegatesUEATime': 'f',
		'tos.docDelegatesDataProtectionUEA': '',
		'tos.docDelegatesDataProtectionUEATime': 'f',
		'tos.paperAnnualBook': 'f',
		'tos.paperAnnualBookTime': 'f'
	},
	fieldAliases: {
		codeholderId: 'codeholders_delegations.codeholderId',
		org: 'codeholders_delegations.org',
		cities: () => AKSO.db.raw('1'),
		cityCountries: () => AKSO.db.raw('1'),
		countries: () => AKSO.db.raw('1'),
		subjects: () => AKSO.db.raw('1'),
		'hosting.maxDays': 'codeholders_delegations_hosting.maxDays',
		'hosting.maxPersons': 'codeholders_delegations_hosting.maxPersons',
		'hosting.description': 'codeholders_delegations_hosting.description',
		'hosting.psProfileURL': 'codeholders_delegations_hosting.psProfileURL',
		'tos.docDataProtectionUEA': 'tos_docDataProtectionUEA',
		'tos.docDataProtectionUEATime': 'tos_docDataProtectionUEA_time',
		'tos.docDelegatesUEA': 'tos_docDelegatesUEA',
		'tos.docDelegatesUEATime': 'tos_docDelegatesUEA_time',
		'tos.docDelegatesDataProtectionUEA': 'tos_docDelegatesDataProtectionUEA',
		'tos.docDelegatesDataProtectionUEATime': 'tos_docDelegatesDataProtectionUEA_time',
		'tos.paperAnnualBook': 'tos_paperAnnualBook',
		'tos.paperAnnualBookTime': 'tos_paperAnnualBook_time'
	},
	customFilterCompOps: {
		$hasAny: {
			subjects: (query, arr) => {
				query.whereExists(function () {
					this.select(1).from('codeholders_delegations_subjects')
						.whereRaw('codeholders_delegations_subjects.codeholderId = codeholders_delegations.codeholderId')
						.whereRaw('codeholders_delegations_subjects.org = codeholders_delegations.org')
						.whereIn('codeholders_delegations_subjects.subjectId', arr);
				});
			},
			cities: (query, arr) => {
				query.whereExists(function () {
					const cities = arr
						.filter(x => {
							if (typeof x === 'number') {
								return true;
							}
							if (typeof x === 'string') {
								return x[0] === 'Q';
							}
							return false;
						})
						.map(x => {
							if (typeof x === 'string') {
								x = x.substring(1);
							}
							return x;
						});
					this.select(1).from('codeholders_delegations_cities')
						.whereRaw('codeholders_delegations_cities.codeholderId = codeholders_delegations.codeholderId')
						.whereRaw('codeholders_delegations_cities.org = codeholders_delegations.org')
						.whereIn('codeholders_delegations_cities.city', cities);
				});
			},
			cityCountries: (query, arr) => {
				query.whereExists(function () {
					this.select(1).from('codeholders_delegations_cities')
						.whereRaw('codeholders_delegations_cities.codeholderId = codeholders_delegations.codeholderId')
						.whereRaw('codeholders_delegations_cities.org = codeholders_delegations.org')
						.joinRaw('INNER JOIN ??.cities geo ON geo.id = codeholders_delegations_cities.city', [
							AKSO.conf.mysql.geodbDatabase
						])
						.whereIn('geo.country', arr);
				});
			}
		}
	},
	customFilterLogicOps: {
		$countries: ({ query, filter } = {}) => {
			if (typeof filter !== 'object' || filter === null || Array.isArray(filter)) {
				const err = new Error('$countries expects an object');
				err.statusCode = 400;
				throw err;
			}
			query.whereExists(function () {
				this.select(1).from('codeholders_delegations_countries')
					.whereRaw('codeholders_delegations_countries.codeholderId = codeholders_delegations.codeholderId')
					.whereRaw('codeholders_delegations_countries.org = codeholders_delegations.org');

				QueryUtil.filter({
					fields: {
						country: 'f',
						level: 'f',
					},
					query: this,
					filter
				});
			});
		},
		$hasHosting: ({ query, filter } = {}) => {
			if (typeof filter !== 'boolean') {
				const err = new Error('$hasHosting expects a boolean');
				err.statusCode = 400;
				throw err;
			}
			query.whereRaw(`codeholders_delegations_hosting.codeholderId IS ${filter ? 'NOT' : ''} NULL`);
		}
	},
	alwaysSelect: [
		...parSchema.alwaysSelect
	],
	afterQuery: parSchema.afterQuery
};
