import QueryUtil from 'akso/lib/query-util';

import { schema as parSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';
import { getSignedURLObjectGET } from 'akso/lib/s3';

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
		'size': '',
		'url': '',
	},
	fieldAliases: {
		url: 's3Id',
	},
};

async function afterQuery (arr, done, req) { // eslint-disable-line no-unused-vars
	if (!arr.length || !arr[0].s3Id) { return done(); }
	for (const row of arr) {
		row.url = await getSignedURLObjectGET({
			key: row.s3Id,
			expiresIn: 15 * 60, // 15 minutes
		});
		delete row.s3Id;
	}
	done();
}

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [ 'files' ];
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
			req, res, schema, query, afterQuery,
		});
	}
};
