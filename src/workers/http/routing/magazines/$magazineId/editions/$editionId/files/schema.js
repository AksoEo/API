import fs from 'pn/fs';
import path from 'pn/path';

export const schema = {
	defaultFields: [ 'format' ],
	fields: {
		'format': 'f',
		'downloads': 'f',
		'size': ''
	},
	fieldAliases: {
		'size': () => AKSO.db.raw('1')
	},
	alwaysSelect: 'format'
};

export async function afterQuery (arr, done, req) {
	if (!arr.length || !arr[0].size) { return done(); }
	const fileNames = arr.map(row => {
		return path.join(req.params.magazineId, req.params.editionId, row.format);
	});
	const stats = await Promise.all(fileNames.map(file => {
		return fs.stat(path.join(AKSO.conf.dataDir, 'magazine_edition_files', file));
	}));
	for (let i in stats) {
		const stat = stats[i];
		arr[i].size = stat.size;
	}
	done();
}
