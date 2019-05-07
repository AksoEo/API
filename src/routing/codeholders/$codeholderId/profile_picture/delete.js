import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';

import { schema as parSchema, memberFilter, memberFieldsManual } from '../../schema';
import { modQuerySchema } from '../../../../lib/codeholder-utils';

export default {
	schema: {
		query: modQuerySchema,
		body: null,
		requirePerms: 'codeholders.update'
	},

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'id',
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

		// Remove the files
		await fs.remove(picDir);

		// Update the db
		await AKSO.db('codeholders')
			.where('id', req.params.codeholderId)
			.update({ hasProfilePicture: false });

		// Update datum history
		await AKSO.db('codeholders_hist_profilePicture')
			.insert({
				codeholderId: req.params.codeholderId,
				modTime: moment().unix(),
				modBy: req.user.modBy,
				modCmt: req.query.modCmt,
				hasProfilePicture: false
			});

		res.sendStatus(204);
	}
};
