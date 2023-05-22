import { deleteObject } from 'akso/lib/s3';

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
		const requiredMemberFields = [ 'files' ];
		if (!memberFieldsManual(requiredMemberFields, req, 'w')) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		// Obtain the file's s3Id
		const fileMeta = await AKSO.db('codeholders_files')
			.first('s3Id')
			.where({
				codeholderId: req.params.codeholderId,
				id: req.params.fileId,
			});
		if (!fileMeta) { return res.sendStatus(404); }

		// Delete the file from s3
		await deleteObject(fileMeta.s3Id);

		// Delete the file from db
		await AKSO.db('codeholders_files')
			.where('id', req.params.fileId)
			.delete();

		res.sendStatus(204);
	}
};
