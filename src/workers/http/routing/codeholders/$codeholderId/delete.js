import fs from 'fs-extra';
import path from 'path';

import { schema as parSchema, memberFilter } from '../schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: null,
		requirePerms: 'codeholders.delete'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Try to find the codeholder
		const query = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, query, req);

		if (!await query) {
			return res.sendStatus(404);
		}

		await AKSO.db('codeholders')
			.where('id', req.params.codeholderId)
			.delete();

		// Clean up the codeholder's data
		await Promise.all([
			fs.remove(path.join(AKSO.conf.dataDir, 'codeholder_files', req.params.codeholderId)),
			fs.remove(path.join(AKSO.conf.dataDir, 'codeholder_pictures', req.params.codeholderId))
		]);

		res.sendStatus(204);
	}
};
