import { getSignedURLObjectGET } from 'akso/lib/s3';

export const schema = {
	defaultFields: [ 'format' ],
	fields: {
		'format': 'f',
		'downloads': 'f',
		'size': '',
		'url': '',
	},
	fieldAliases: {
		'url': 's3Id',
	},
};

export async function afterQuery (arr, done, req) { // eslint-disable-line no-unused-vars
	if (!arr.length || !arr[0].s3Id) { return done(); }
	
	for (const row of arr) {
		row.url = await getSignedURLObjectGET({
			key: row.s3Id,
			expiresIn: 2 * 60 * 60, // 2 hours
		});
	}

	done();
}
