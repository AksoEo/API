export const schema = {
	defaultFields: [ 'name' ],
	fields: {
		'name': 'f',
		'list': ''
	},
	fieldAliases: {
		list: () => AKSO.db.raw('1')
	},
	alwaysSelect: [
		'name'
	]
};

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].list) { return done(); }

	for (const row of arr) {
		const countriesOrgs = await AKSO.db('countries_lists_orgs')
			.where('listName', row.name)
			.select('country', 'orgCodeholderId')
			.orderBy('i');

		row.list = {};
		for (const dbEntry of countriesOrgs) {
			if (!row.list[dbEntry.country]) {
				row.list[dbEntry.country] = [];
			}
			row.list[dbEntry.country].push(dbEntry.orgCodeholderId);
		}
	}

	done();
}
