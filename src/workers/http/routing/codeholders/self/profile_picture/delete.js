import fs from 'fs-extra';
import path from 'path';
import moment from 'moment-timezone';

import { memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'profilePicture'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'w', req.ownMemberFields)) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Check if the codeholder has a profile picture
		const picDir = path.join(AKSO.conf.dataDir, 'codeholder_pictures', req.user.user.toString());
		const hasProfilePicture = await fs.pathExists(picDir);

		if (!hasProfilePicture) { return res.sendStatus(404); }

		// Remove the files
		await fs.remove(picDir);

		// Update the db
		const oldData = await AKSO.db('codeholders')
			.first('profilePictureHash')
			.where('id', req.user.user);

		await AKSO.db('codeholders')
			.where('id', req.user.user)
			.update({ profilePictureHash: null });

		// Update datum history
		await AKSO.db('codeholders_hist_profilePictureHash')
			.insert({
				codeholderId: req.user.user,
				modTime: moment().unix(),
				modBy: req.user.modBy,
				modCmt: AKSO.CODEHOLDER_OWN_CHANGE_CMT,
				profilePictureHash: oldData.profilePictureHash || null
			});

		res.sendStatus(204);
	}
};
