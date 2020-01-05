import fs from 'fs-extra';
import path from 'path';

import QueryUtil from 'akso/lib/query-util';
import CodeholderFileResource from 'akso/lib/resources/codeholder-file-resource';

import { schema as parSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';

const schema = {
	query: 'collection',
	body: null,
	requirePerms: 'codeholders.read',
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'time': 'f',
		'addedBy': 'f',
		'name': 'fs',
		'description': 's',
		'mime': '',
		'size': ''
	},
	fieldAliases: {
		'size': () => AKSO.db.raw('1')
	},
	alwaysSelect: [
		'id'
	]
};

async function afterQuery (arr, done, req) {
	if (!arr.length || !arr[0].size) { return done(); }
	const fileNames = arr.map(row => row.id.toString());
	const stats = await Promise.all(fileNames.map(file => {
		return fs.stat(path.join(AKSO.conf.dataDir, 'codeholder_files', req.params.codeholderId, file));
	}));
	for (let i in stats) {
		const stat = stats[i];
		arr[i].size = stat.size;
	}
	done();
}

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'files'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const query = AKSO.db('codeholders_files')
			.where('codeholderId', req.params.codeholderId);

		await QueryUtil.handleCollection({
			req, res, schema, query,
			afterQuery, Res: CodeholderFileResource,
			passToCol: [[req, schema]]
		});
	}
};
