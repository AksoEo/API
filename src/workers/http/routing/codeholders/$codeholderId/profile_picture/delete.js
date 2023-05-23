import moment from 'moment-timezone';

import { schema as parSchema, memberFilter, memberFieldsManual, profilePictureSizes } from 'akso/workers/http/routing/codeholders/schema';
import { modQuerySchema } from 'akso/workers/http/lib/codeholder-util';
import { deleteObjects } from 'akso/lib/s3';

export default {
	schema: {
		query: modQuerySchema,
		body: null,
		requirePerms: 'codeholders.update'
	},

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'profilePicture'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'w')) {
			return res.status(403).type('text/plain').send('Missing permitted codeholder field profilePicture, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		// Get the s3 id of the profile picture, if it exists
		const picData = await AKSO.db('codeholders')
			.where('id', req.params.codeholderId)
			.first('profilePictureS3Id');
		if (!picData) { return res.sendStatus(404); }

		// Delete the files
		await deleteObjects({
			keys: profilePictureSizes.map(size => `codeholders-profilePictures-${picData.profilePictureS3Id}-${size}`),
		});

		// Update the db
		const oldData = await AKSO.db('codeholders')
			.where('id', req.params.codeholderId)
			.first('profilePictureHash');

		await AKSO.db('codeholders')
			.where('id', req.params.codeholderId)
			.update({
				profilePictureHash: null,
				profilePictureS3Id: null,
			});

		// Update datum history
		await AKSO.db('codeholders_hist_profilePictureHash')
			.insert({
				codeholderId: req.params.codeholderId,
				modTime: moment().unix(),
				modBy: req.user.modBy,
				modCmt: req.query.modCmt,
				profilePictureHash: oldData.profilePictureHash ?? null,
			});

		res.sendStatus(204);
	}
};
