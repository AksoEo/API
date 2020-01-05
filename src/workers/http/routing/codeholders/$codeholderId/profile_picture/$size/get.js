import fs from 'fs-extra';
import path from 'path';

import { schema as parSchema, memberFilter, memberFieldsManual, profilePictureSizes } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'codeholders.read'
	},

	run: async function run (req, res) {
		// Check if the size is right
		const size = parseInt(req.params.size.slice(0, -2), 10);
		if (!profilePictureSizes.includes(size)) {
			return res.status(400).type('text/plain').send('Invalid picture size requested');
		}

		// Check member fields
		const requiredMemberFields = [
			'profilePicture'
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

		// Check if the codeholder has a profile picture
		const picDir = path.join(AKSO.conf.dataDir, 'codeholder_pictures', req.params.codeholderId);
		const hasProfilePicture = await fs.pathExists(picDir);

		if (!hasProfilePicture) { return res.sendStatus(404); }

		// Set the mime type
		const picData = await fs.readJson(path.join(picDir, 'pic.txt'));
		res.type(picData.mime);

		// Fetch the profile picture
		res.sendFile(path.join(picDir, size.toString()));
	}
};
