import path from 'path';
import crypto from 'pn/crypto';

import { validateDataEntry, insertFormDataEntry } from 'akso/workers/http/lib/form-util';
import { isActiveMember } from 'akso/workers/http/lib/codeholder-util';

import { memberFilter, schema as parSchema } from 'akso/workers/http/routing/codeholders/schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				codeholderId: {
					type: 'integer',
					format: 'uint32'
				},
				approved: {
					type: 'boolean'
				},
				notes: {
					type: 'string',
					minLength: 1,
					maxLength: 10000,
					nullable: true
				},
				allowInvalidData: {
					type: 'boolean',
					default: false
				},
				data: {
					type: 'object'
				}
			},
			required: [
				'data'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const congressData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org', 'dateFrom');
		if (!congressData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.participants.create.' + congressData.org)) { return res.sendStatus(403); }

		// Make sure the form exists
		const formData = await AKSO.db('congresses_instances_registrationForm')
			.where('congressInstanceId', req.params.instanceId)
			.first('form', 'formId', 'allowGuests');
		if (!formData) { return res.sendStatus(404); }

		// Require codeholderId if not allowGuests
		if (!formData.allowGuests && !('codeholderId' in req.body)) {
			return res.status(400).type('text/plain')
				.send('codeholderId is required as allowGuests is false in the registration form');
		}

		if ('codeholderId' in req.body) {
			// Ensure that the we can access the codeholder through the member filter
			const codeholderQuery = AKSO.db('view_codeholders')
				.where('id', req.body.codeholderId)
				.first(1);
			memberFilter(parSchema, codeholderQuery, req);
			if (!await codeholderQuery) { return res.sendStatus(404); }

			// Make sure the participant doesn't already exist
			const codeholderAlreadyExists = await AKSO.db('congresses_instances_participants')
				.where({
					congressInstanceId: req.params.instanceId,
					codeholderId: req.body.codeholderId
				})
				.first(1);
			if (codeholderAlreadyExists) {
				return res.status(409).type('text/plain')
					.send('codeholderId already registered');
			}
		}

		const formValues = {
			'@created_time': null,
			'@edited_time': null,
			'@upfront_time': null,
			'@is_member': req.body.codeholderId ?
				await isActiveMember(req.body.codeholderId, congressData.dateFrom) : false
		};
		await validateDataEntry(formData.form, req.body.data, formValues, req.body.allowInvalidData);

		// Insert the participant's data
		const dataId = await crypto.randomBytes(12);
		await insertFormDataEntry(formData.form, formData.formId, dataId, req.body.data);

		// Insert the participant
		await AKSO.db('congresses_instances_participants')
			.insert({
				congressInstanceId: req.params.instanceId,
				codeholderId: req.body.codeholderId,
				dataId,
				approved: req.body.approved,
				notes: req.body.notes
			});

		const dataIdHex = dataId.toString('hex');
		res.set('Location', path.join(
			AKSO.conf.http.path,
			'congresses',
			req.params.congressId,
			'instances',
			req.params.instanceId,
			'participants',
			dataIdHex
		));
		res.set('X-Identifier', dataIdHex);
		res.sendStatus(201);
	}
};
