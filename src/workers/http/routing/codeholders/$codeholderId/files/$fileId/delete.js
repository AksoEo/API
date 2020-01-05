import path from 'path';

import { removePathAndEmptyParents } from 'akso/lib/file-util';

import { schema as parSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';

const schema = {
	query: null,
	body: null,
	requirePerms: 'codeholders.update'
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'files'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'w')) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		// Delete the file if it exists
		const deleted = await AKSO.db('codeholders_files')
			.where({
				codeholderId: req.params.codeholderId,
				id: req.params.fileId
			})
			.delete();

		if (!deleted) { return res.sendStatus(404); }

		// Delete from the drive
		const parPath = path.join(AKSO.conf.dataDir, 'codeholder_files', req.params.codeholderId);
		await removePathAndEmptyParents(parPath, path.join(parPath, req.params.fileId));
		res.sendStatus(204);
	}
};
