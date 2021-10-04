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
		countries: '',
		subjects: '',
		hosting: '',
		tos: ''
	},
	fieldAliases: {
		id: 'delegations_applications.id',
		tos: () => AKSO.db.raw('1'),
		cities: () => AKSO.db.raw('JSON_ARRAYAGG(delegations_applications_cities.city)'),
		cityCountries: () => AKSO.db.raw('1')
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
		'tos_docDataProtectionUEA',
		'tos_docDelegatesUEA',
		'tos_docDelegatesDataProtectionUEA',
		'tos_paperAnnualBook',
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
