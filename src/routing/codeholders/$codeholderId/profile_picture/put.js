import fs from 'fs-extra';

import { schema as parSchema, memberFilter, memberFieldsManual } from '../../schema';
import { modQuerySchema, setProfilePicture } from '../../../../lib/codeholder-utils';

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
				mimeCheck: mime => mimeTypes.includes(mime)
			}
		],
		requirePerms: 'codeholders.update'
	},

	run: async function run (req, res) {
		const file = req.files.picture[0];

		// Check member fields
		const requiredMemberFields = [
			'id',
			'profilePicture'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'w')) {
			await cleanUp(file);
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) {
			await cleanUp(file);
			return res.sendStatus(404);
		}

		try {
			await setProfilePicture(req.params.codeholderId, file.path, file.mimetype, req.user.modBy, req.query.modCmt);
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
