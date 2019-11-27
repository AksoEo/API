import path from 'path';

import { schema as parSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';

const schema = {
	query: null,
	body: null,
	requirePerms: 'codeholders.read'
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
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		// Make sure the file exists
		const fileData = await AKSO.db('codeholders_files')
			.where({
				id: req.params.fileId,
				codeholderId: req.params.codeholderId
			})
			.first('mime', 'name');

		if (!fileData) { return res.sendStatus(404); }

		const filePath = path.join(AKSO.conf.dataDir, 'codeholder_files', req.params.codeholderId, req.params.fileId);
		res
			.type(fileData.mime)
			.set('Content-Disposition', 'inline; filename*=UTF-8\'\'' + encodeURIComponent(fileData.name))
			.sendFile(filePath);
	}
};
