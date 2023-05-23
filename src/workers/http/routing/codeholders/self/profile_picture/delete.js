import moment from 'moment-timezone';

import { deleteObjects } from 'akso/lib/s3';
import { memberFieldsManual, profilePictureSizes } from 'akso/workers/http/routing/codeholders/schema';

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
			return res.status(403).type('text/plain').send('Missing permitted codeholder field profilePicture, check /perms');
		}

		// Get the s3 id of the profile picture, if it exists
		const picData = await AKSO.db('codeholders')
			.where('id', req.user.user)
			.first('profilePictureS3Id');
		if (!picData) { return res.sendStatus(404); }

		// Delete the files
		await deleteObjects({
			keys: profilePictureSizes.map(size => `codeholders-profilePictures-${picData.profilePictureS3Id}-${size}`),
		});

		// Update the db
		const oldData = await AKSO.db('codeholders')
			.first('profilePictureHash')
			.where('id', req.user.user);

		await AKSO.db('codeholders')
			.where('id', req.user.user)
			.update({
				profilePictureHash: null,
				profilePictureS3Id: null,
			});

		// Update datum history
		await AKSO.db('codeholders_hist_profilePictureHash')
			.insert({
				codeholderId: req.user.user,
				modTime: moment().unix(),
				modBy: req.user.modBy,
				modCmt: AKSO.CODEHOLDER_OWN_CHANGE_CMT,
				profilePictureHash: oldData.profilePictureHash ?? null,
			});

		res.sendStatus(204);
	}
};
