import { memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';
import { setProfilePicture } from 'akso/workers/http/lib/codeholder-util';

const mimeTypes = [
	'image/jpeg',
	'image/png'
];

export default {
	schema: {
		query: null,
		body: null,
		multipart: [
			{
				name: 'picture',
				maxCount: 1,
				minCount: 1,
				maxSize: '2mb',
				mimeCheck: mime => mimeTypes.includes(mime)
			}
		]
	},

	run: async function run (req, res) {
		const file = req.files.picture[0];

		// Check member fields
		const requiredMemberFields = [
			'profilePicture'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'w', req.ownMemberFields)) {
			return res.status(403).type('text/plain').send('Missing permitted codeholder field profilePicture, check /perms');
		}

		await setProfilePicture(req.user.user, file.path, file.mimetype, req.user.modBy, AKSO.CODEHOLDER_OWN_CHANGE_CMT);

		res.sendStatus(204);
	}
};
