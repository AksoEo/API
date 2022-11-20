export const schema = {
	defaultFields: [ 'code' ],
	fields: {
		'code': 'f',
		'name': 'fs',
		'countries': ''
	},
	fieldAliases: {
		'countries': () => AKSO.db.raw('1')
	},
	alwaysSelect: [ 'code' ],
	customFilterCompOps: {
		$hasAny: {
			countries: (query, arr) => {
				query.whereExists(function () {
					this.select(1).from('countries_groups_members')
						.whereRaw('countries_groups_members.group_code = countries_groups.code')
						.whereIn('countries_groups_members.country_code', arr);
				});
			},
		}
	},
};

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].countries) { return done(); }

	const countries = await AKSO.db('countries_groups')
		.leftJoin('countries_groups_members', 'code', 'group_code')
		.select('code', 'country_code')
		.whereIn('code', arr.map(obj => obj.code));

	const countriesMap = {};

	for (const countryObj of countries) {
		if (!(countryObj.code in countriesMap)) {
			countriesMap[countryObj.code] = [];
		}
		countriesMap[countryObj.code].push(countryObj.country_code);
	}

	for (const row of arr) {
		row.countries = countriesMap[row.code];
	}

	done();
}
