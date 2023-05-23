import { schema as parSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';
import { modQuerySchema, setProfilePicture } from 'akso/workers/http/lib/codeholder-util';

const mimeTypes = [
	'image/jpeg',
	'image/png'
];

export default {
	schema: {
		query: modQuerySchema,
		body: null,
		multipart: [
			{
				name: 'picture',
				maxCount: 1,
				minCount: 1,
				maxSize: '2mb',
				mimeCheck: mime => mimeTypes.includes(mime),
			}
		],
		requirePerms: 'codeholders.update',
	},

	run: async function run (req, res) {
		const file = req.files.picture[0];

		// Check member fields
		const requiredMemberFields = [ 'profilePicture' ];
		if (!memberFieldsManual(requiredMemberFields, req, 'w')) {
			return res.status(403).type('text/plain').send('Missing permitted codeholder field: profilePicture, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) {
			return res.sendStatus(404);
		}

		await setProfilePicture(req.params.codeholderId, file.path, file.mimetype, req.user.modBy, req.query.modCmt);

		res.sendStatus(204);
	}
};
