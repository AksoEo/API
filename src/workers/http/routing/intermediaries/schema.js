export const schema = {
	defaultFields: [ 'countryCode' ],
	fields: {
		countryCode: 'f',
		codeholders: '',
	},
	fieldAliases: {
		codeholders: () => AKSO.db.raw('1'),
	},
	alwaysSelect: [ 'countryCode' ],
};

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].codeholders) { return done(); }

	const codeholders = await AKSO.db('intermediaries')
		.select('countryCode', 'arrIndex', 'codeholderId', 'paymentDescription')
		.whereIn('countryCode', arr.map(obj => obj.countryCode) ?? []);

	const codeholdersMap = {};

	for (const codeholderObj of codeholders) {
		if (!(codeholderObj.countryCode in codeholdersMap)) {
			codeholdersMap[codeholderObj.countryCode] = [];
		}
		codeholdersMap[codeholderObj.countryCode][codeholderObj.arrIndex] = {
			codeholderId: codeholderObj.codeholderId,
			paymentDescription: codeholderObj.paymentDescription,
		};
	}

	for (const row of arr) {
		row.codeholders = codeholdersMap[row.countryCode] ?? [];
	}

	done();
}
