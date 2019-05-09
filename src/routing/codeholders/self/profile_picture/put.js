import fs from 'fs-extra';

import { memberFieldsManual } from '../../schema';
import { setProfilePicture } from '../../../../lib/codeholder-utils';

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
			await cleanUp(file);
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		try {
			await setProfilePicture(req.user.user, file.path, file.mimetype, req.user.modBy, AKSO.CODEHOLDER_OWN_CHANGE_CMT);
		} catch (e) {
			cleanUp();
			throw e;
		}

		res.sendStatus(204);
	}
};

async function cleanUp (file) {
	await fs.unlink(file.path);
}
