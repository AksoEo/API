import fs from 'fs-extra';
import path from 'path';
import moment from 'moment-timezone';

import { schema as parSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 80,
					pattern: '^[^\\n]+$'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 300
				}
			},
			additionalProperties: false,
			required: [ 'name' ]
		},
		multipart: [
			{
				name: 'file',
				maxCount: 1,
				minCount: 1,
				maxSize: '6mb'
			}
		],
		requirePerms: 'codeholders.update'
	},

	run: async function run (req, res) {
		const file = req.files.file[0];

		// Check member fields
		const requiredMemberFields = [
			'files'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'w')) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}


		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(parSchema, codeholderQuery, req);
		if (!await codeholderQuery) {
			return res.sendStatus(404);
		}

		// Insert into the db
		const fileId = (await AKSO.db('codeholders_files').insert({
			time: moment().unix(),
			codeholderId: req.params.codeholderId,
			addedBy: req.user && req.user.user ? req.user.user : null,
			name: req.body.name,
			description: req.body.description,
			mime: file.mimetype
		}))[0];

		// Move the file
		await fs.move(file.path, path.join(AKSO.conf.dataDir, 'codeholder_files', req.params.codeholderId, fileId.toString()));

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'codeholders',
			req.params.codeholderId,
			'files',
			fileId.toString()
		));
		res.set('X-Identifier', fileId);
		res.sendStatus(201);
	}
};
