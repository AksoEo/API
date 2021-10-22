export default {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		codeholderId: 'f',
		org: 'f',
		time: 'f',
		status: 'f',
		statusTime: 'f',
		statusBy: 'f',
		internalNotes: 's',
		applicantNotes: '',
		cities: '',
		cityCountries: '',
		subjects: '',
		hosting: '',
		'tos.docDataProtectionUEA': '',
		'tos.docDelegatesUEA': '',
		'tos.docDelegatesDataProtectionUEA': '',
		'tos.paperAnnualBook': ''
	},
	fieldAliases: {
		id: 'delegations_applications.id',
		cities: () => AKSO.db.raw('JSON_ARRAYAGG(delegations_applications_cities.city)'),
		cityCountries: () => AKSO.db.raw('1'),
		'tos.docDataProtectionUEA': 'tos_docDataProtectionUEA',
		'tos.docDelegatesUEA': 'tos_docDelegatesUEA',
		'tos.docDelegatesDataProtectionUEA': 'tos_docDelegatesDataProtectionUEA',
		'tos.paperAnnualBook': 'tos_paperAnnualBook'
	},
	customFilterCompOps: {
		$hasAny: {
			cityCountries: (query, arr) => {
				query.whereExists(function () {
					this.select(1).from(AKSO.db.raw('delegations_applications_cities AS c'))
						.whereRaw('c.id = delegations_applications.id')
						.joinRaw('INNER JOIN ??.cities geo ON geo.id = c.city', [
							AKSO.conf.mysql.geodbDatabase
						])
						.whereIn('geo.country', arr);
				});
			}
		}
	},
	alwaysSelect: [
		'cities'
	],
	afterQuery: async function afterQuery (arr, done) {
		if (!arr.length) { return done(); }

		const cities = [...new Set([].concat(...Object.values(arr.map(x => x.cities))))];

		if (cities.length) {
			const cityCountries = await AKSO.geodb('cities')
				.select('id', 'country')
				.whereIn('id', cities);

			for (const row of arr) {
				row.cityCountries = cityCountries
					.filter(x => row.cities.includes(x.id))
					.map(x => x.country);
			}
		}

		done();
	}
};
