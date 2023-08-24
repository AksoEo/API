import path from 'path';

import { schema as codeholderSchema, memberFilter, memberFieldsManual } from 'akso/workers/http/routing/codeholders/schema';
import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: null,
		body: {
			type: 'object',
			properties: {
				durationFrom: {
					type: 'integer',
					format: 'int64',
					nullable: true
				},
				durationTo: {
					type: 'integer',
					format: 'int64',
					nullable: true
				},
				roleId: {
					type: 'integer',
					format: 'uint32'
				},
				dataCountry: {
					type: 'string',
					pattern: '^[a-z]{2}$',
					nullable: true
				},
				dataOrg: {
					type: 'integer',
					format: 'uint32',
					nullable: true
				},
				dataString: {
					type: 'string',
					minLength: 1,
					maxLength: 128,
					pattern: '^[^\\n]+$',
					nullable: true
				}
			},
			required: [ 'roleId' ],
			additionalProperties: false
		},
		requirePerms: [
			'codeholders.update',
			'codeholder_roles.read'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'roles'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'w')) {
			return res.status(403).type('text/plain').send('Missing codeholder field roles, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		// Make sure the codeholder role exists
		const exists = await AKSO.db('codeholderRoles')
			.where('id', req.body.roleId)
			.first(1);
		if (!exists) { return res.sendStatus(404); }

		// Make sure dataCountry exists if used
		if (req.body.dataCountry) {
			const exists = await AKSO.db('countries')
				.where({
					code: req.body.dataCountry,
					enabled: true
				})
				.first(1);
			if (!exists) {
				return res.status(400).type('text/plain')
					.send('Invalid dataCountry');
			}
		}

		// Make sure dataOrg exists and can be seen through the member filter, if used
		if ('dataOrg' in req.body && req.body.dataOrg !== null) {
			if (!req.hasPermission('codeholders.read')) {
				return res.status(400).type('text/plain')
					.send('Missing permission codeholders.read');
			}
			const existsQuery = AKSO.db('view_codeholders')
				.where({
					codeholderType: 'org',
					id: req.body.dataOrg
				})
				.first(1);
			memberFilter(codeholderSchema, existsQuery, req);
			if (!await existsQuery) {
				return res.status(400).type('text/plain')
					.send('Cannot find dataOrg codeholder through member filter');
			}
		}

		const id = (await AKSO.db('codeholderRoles_codeholders').insert({
			...req.body,
			...{
				codeholderId: req.params.codeholderId
			}
		}))[0];

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'codeholders',
			req.params.codeholderId,
			'roles',
			id.toString()
		));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
