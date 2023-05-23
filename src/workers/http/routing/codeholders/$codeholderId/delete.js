import { deleteObjects } from 'akso/lib/s3';
import { schema as parSchema, memberFilter, profilePictureSizes } from '../schema';

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
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first('profilePictureS3Id');
		memberFilter(parSchema, codeholderQuery, req);
		const codeholder = await codeholderQuery;

		if (!codeholder) {
			return res.sendStatus(404);
		}

		// Find all the codeholder's files ...
		const codeholderFiles = await AKSO.db('codeholders_files')
			.pluck('s3Id')
			.where('codeholderId', req.params.codeholderId);

		if (codeholderFiles.length) {
			// ... and delete them
			await deleteObjects({ keys: codeholderFiles });
		}

		if (codeholder.profilePictureS3Id) {
			// Delete the codeholder's profile picture
			const s3Ids = profilePictureSizes.map(size => {
				return `codeholders-profilePictures-${codeholder.profilePictureS3Id}-${size}`;
			});
			await deleteObjects({ keys: s3Ids });
		}

		// Delete the codeholder
		await AKSO.db('codeholders')
			.where('id', req.params.codeholderId)
			.delete();

		res.sendStatus(204);
	}
};
