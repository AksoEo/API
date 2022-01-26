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
		const orgs = await AKSO.db('orgLists_orgs')
			.where('listName', row.name)
			.select('tagName', 'orgCodeholderId')
			.orderBy('i');

		row.list = {};
		for (const dbEntry of orgs) {
			if (!row.list[dbEntry.tagName]) {
				row.list[dbEntry.tagName] = [];
			}
			row.list[dbEntry.tagName].push(dbEntry.orgCodeholderId);
		}
	}

	done();
}
