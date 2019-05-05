import QueryUtil from '../../../../lib/query-util';

import { schema as parSchema, memberFilter, memberFieldsManual } from '../../schema';

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
		'mime': ''
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'id',
			'files'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(403).send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const query = AKSO.db('codeholders_files')
			.where('codeholderId', req.params.codeholderId);

		await QueryUtil.handleCollection(req, res, schema, query);
	}
};
