import path from 'path';

import { validateDataEntry, insertFormDataEntry } from 'akso/workers/http/lib/form-util';
import { isActiveMember } from 'akso/workers/http/lib/codeholder-util';

import { manualDataValidation } from '../schema';

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
			.first('*');
		if (!formData) { return res.sendStatus(404); }

		// Make sure the participant exists
		const participantData = await AKSO.db('congresses_instances_participants')
			.joinRaw('INNER JOIN `forms_data` d on `d`.dataId = congresses_instances_participants.dataId')
			.where({
				'congressInstanceId': req.params.instanceId,
				'd.dataId': req.params.dataId
			})
			.first('*');
		if (!participantData) { return res.sendStatus(404); }

		await manualDataValidation(req, res, formData);

		if ('codeholderId' in req.body) {
			// Make sure the participant doesn't already exist
			const codeholderAlreadyExists = await AKSO.db('congresses_instances_participants')
				.where({
					congressInstanceId: req.params.instanceId,
					codeholderId: req.body.codeholderId
				})
				.whereNot('dataId', req.params.dataId)
				.first(1);
			if (codeholderAlreadyExists) {
				return res.status(409).type('text/plain')
					.send('codeholderId already registered with another dataId');
			}
		}

		const formValues = {
			'@created_time': participantData.createdTime,
			'@edited_time': participantData.editedTime,
			'@upfront_time': null,// TODO
			'@is_member': req.body.codeholderId ?
				await isActiveMember(req.body.codeholderId, congressData.dateFrom) : false
		};
		const participantMetadata = await validateDataEntry(formData, req.body.data, formValues, req.body.allowInvalidData);

		// Insert the participant's dat
		await insertFormDataEntry(formData.form, formData.formId, req.params.dataId, req.body.data);

		// Insert the participant
		await AKSO.db('congresses_instances_participants')
			.where('dataId', req.params.dataId)
			.update({
				codeholderId: req.body.codeholderId,
				approved: req.body.approved,
				notes: req.body.notes,
				price: participantMetadata.price
			});

		const dataIdHex = req.params.dataId.toString('hex');
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
		res.sendStatus(204);
	}
};
