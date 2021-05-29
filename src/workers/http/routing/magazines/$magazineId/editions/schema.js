import fs from 'fs-extra';
import path from 'path';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'idHuman': 's',
		'date': 'f',
		'description': 's',
		'published': 'f',
		'hasThumbnail': ''
	},
	fieldAliases: {
		hasThumbnail: () => AKSO.db.raw('1')
	},
	alwaysSelect: [
		'magazineId',
		'id'
	]
};

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].hasThumbnail) { return done(); }

	for (const row of arr) {
		const thumbnailPath = path.join(
			AKSO.conf.dataDir,
			'magazine_edition_thumbnails',
			row.magazineId,
			row.id
		);

		let access = false;
		try {
			await fs.access(thumbnailPath);
			access = true;
		} catch (e) {
			// noop
		}

		row.hasThumbnail = access;
	}

	done();
}
