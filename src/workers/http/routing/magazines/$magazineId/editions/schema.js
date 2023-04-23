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
		'hasThumbnail': '',
		'subscribers': '',
		'subscriberFiltersCompiled': '',
		'files': '',
	},
	fieldAliases: {
		hasThumbnail: () => AKSO.db.raw('1'),
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

	if (arr[0].hasThumbnail) {
		for (const row of arr) {
			const thumbnailPath = path.join(
				AKSO.conf.dataDir,
				'magazine_edition_thumbnails',
				row.magazineId.toString(),
				row.id.toString()
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
	}

	done();
}
