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
					format: 'uint64',
					nullable: true
				},
				durationTo: {
					type: 'integer',
					format: 'uint64',
					nullable: true
				},
				roleId: {
					type: 'integer',
					format: 'uint32'
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
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
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
