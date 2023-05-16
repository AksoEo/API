import path from 'path';
import crypto from 'pn/crypto';

import { validateDataEntry, insertFormDataEntry } from 'akso/workers/http/lib/form-util';
import { isActiveMember } from 'akso/workers/http/lib/codeholder-util';

import { manualDataValidation, sendParticipantConfirmationNotif } from './schema';

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
				},
				sequenceId: {
					type: 'integer',
					format: 'int32',
					nullable: true
				},
				checkInTime: {
					type: 'integer',
					format: 'uint64',
					nullable: true,
				},
				customFormVars: {
					type: 'object',
					patternProperties: {
						'^@@v_[\\w\\-:ĥŝĝĉĵŭ]{1,18}$': {
							oneOf: [
								{ type: 'boolean' },
								{ type: 'number' },
								{ type: 'null' },
								{
									type: 'string',
									minLength: 1,
									maxLength: 8192,
								},
							],
						},
					},
					maxProperties: 64,
					additionalProperties: false,
				},
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

		await manualDataValidation(req, res, formData);

		const formValues = {
			'@created_time': null,
			'@edited_time': null,
			'@is_member': req.body.codeholderId ?
				await isActiveMember(req.body.codeholderId, congressData.dateFrom) : false
		};
		// Add default custom form vars
		const defaultCustomFormVars = await AKSO.db('congresses_instances_registrationForm_customFormVars')
			.select('name', 'default')
			.where('congressInstanceId', req.params.instanceId);
		for (const defaultCustomFormVar of defaultCustomFormVars) {
			formValues[defaultCustomFormVar.name.substring(1)] = defaultCustomFormVar.default;
		}
		// Add custom form var overrides
		if (req.body.customFormVars) {
			for (const [name, value] of Object.entries(req.body.customFormVars)) {
				formValues[name.substring(1)] = value;
			}
		}

		const participantMetadata = await validateDataEntry({
			formData,
			data: req.body.data,
			addFormValues: formValues,
			allowInvalidData: req.body.allowInvalidData
		});

		// Insert the participant's data
		const dataId = await crypto.randomBytes(12);
		await insertFormDataEntry(formData.form, formData.formId, dataId, req.body.data);

		let price = null;
		if (formData.price_var) {
			price = participantMetadata.evaluate(formData.price_var);
		}

		// Insert the participant
		const trx = await req.createTransaction();
		await trx('congresses_instances_participants')
			.insert({
				congressInstanceId: req.params.instanceId,
				codeholderId: req.body.codeholderId,
				dataId,
				approved: req.body.approved,
				notes: req.body.notes,
				sequenceId: req.body.sequenceId,
				checkInTime: req.body.checkInTime,
				price,
			});
		if (Object.keys(req.body.customFormVars ?? {}).length) {
			await trx('congresses_instances_participants_customFormVars')
				.insert(
					Object.entries(req.body.customFormVars)
						.map(([name, value]) => {
							return {
								congressInstanceId: req.params.instanceId,
								dataId,
								name,
								value: JSON.stringify(value),
							};
						})
				);
		}
		await trx.commit();

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

		if (formData.confirmationNotifTemplateId) {
			await sendParticipantConfirmationNotif(req.params.instanceId, dataId, formData.confirmationNotifTemplateId);
		}
	}
};
