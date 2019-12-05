import fs from 'fs-extra';
import path from 'path';

import { getCodeholderQuery } from 'akso/workers/http/routing/votes/$voteId/codeholder_options/schema';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		// Make sure the codeholder exists as an option
		const baseQuery = (await getCodeholderQuery(req.params.voteId, req)).query;
		delete baseQuery._single.limit;
		const codeholder = await AKSO.db
			.first('profilePicturePublicity')
			.where('id', req.params.codeholderId)
			.from(AKSO.db.raw(`(${baseQuery.toString()}) base`));
		if (!codeholder) { return res.sendStatus(404); }
		const isMember = req.user ? await req.user.isActiveMember() : false;
		if (codeholder.profilePicturePublicity === 'members' && !isMember) {
			return res.sendStatus(404);
		}

		// Check if the codeholder has a profile picture
		const picDir = path.join(AKSO.conf.dataDir, 'codeholder_pictures', req.params.codeholderId);
		const hasProfilePicture = await fs.pathExists(picDir);

		if (!hasProfilePicture) { return res.sendStatus(404); }

		// Set the mime type
		const picData = await fs.readJson(path.join(picDir, 'pic.txt'));
		res.type(picData.mime);

		// Fetch the profile picture
		res.sendFile(path.join(picDir, req.params.size.toString()));
	}
};
