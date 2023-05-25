import { getSignedURLObjectGET } from 'akso/lib/s3';

import { thumbnailSizes } from './$editionId/thumbnail/schema';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'idHuman': 's',
		'date': 'f',
		'description': 's',
		'published': 'f',
		'thumbnail': '',
		'subscribers': '',
		'subscriberFiltersCompiled': '',
		'files': '',
	},
	fieldAliases: {
		thumbnail: 'thumbnailS3Id',
		subscriberFiltersCompiled: () => AKSO.db.raw('1'),
		files: () => AKSO.db.raw('SELECT GROUP_CONCAT(format) FROM magazines_editions_files WHERE editionId = magazines_editions.id'),
	},
	alwaysSelect: [
		'magazineId',
		'id',
		'subscribers',
	]
};

export async function afterQuery (arr, done) {
	if (!arr.length) { return done(); }

	if ('thumbnailS3Id' in arr[0]) {
		for (const row of arr) {
			if (!row.thumbnailS3Id) {
				row.thumbnail = null;
				continue;
			}
			row.thumbnail = Object.fromEntries(await Promise.all(thumbnailSizes.map(async size => {
				const key = `magazines-editions-thumbnails-${row.thumbnailS3Id}-${size}`;
				const url = await getSignedURLObjectGET({ key, expiresIn: 15 * 60 });
				return [ size, url ]; // key, val
			})));
		}
	}

	done();
}
