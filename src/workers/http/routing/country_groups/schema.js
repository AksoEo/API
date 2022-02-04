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

export async function afterQuery (arr, done, req) {
	if (!arr.length || !arr[0].countries) { return done(); }

	const countries = await AKSO.db('countries_groups')
		.leftJoin('countries_groups_members', 'code', 'group_code')
		.select(AKSO.db.raw('group_concat(country_code) as countries'))
		.whereIn('code', arr.map(obj => obj.code))
		.groupBy('code');

	for (let i in countries) {
		arr[i].countries = countries[i].countries ? countries[i].countries.split(',') : null;
	}

	done();
}
