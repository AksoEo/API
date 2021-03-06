import path from 'path';
import { escapeId } from 'mysql2';

import CongressParticipantResource from 'akso/lib/resources/congress-participant-resource';

import { validateDataEntry, insertFormDataEntry } from 'akso/workers/http/lib/form-util';
import { isActiveMember } from 'akso/workers/http/lib/codeholder-util';

import { manualDataValidation, schema as parSchema } from '../schema';

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
					type: 'boolean'
				},
				data: {
					type: 'object'
				},
				sequenceId: {
					type: 'integer',
					format: 'int32',
					nullable: true
				},
				cancelledTime: {
					type: 'integer',
					format: 'uint64',
					nullable: true
				}
			},
			minProperties: 1,
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

		// Make sure the participant exists, and obtain old data
		const participantQuery = AKSO.db('congresses_instances_participants')
			.joinRaw('INNER JOIN `forms_data` d on `d`.dataId = congresses_instances_participants.dataId')
			.where({
				'congressInstanceId': req.params.instanceId,
				'd.dataId': req.params.dataId
			});
		const selectFields = [ 'createdTime', 'editedTime' ];

		// Add the fields of the form
		const formFieldsObj = {};
		for (const formField of formData.form) {
			if (formField.el !== 'input') { continue; }
			formFieldsObj[formField.name] = formField.type;

			const fieldTableAlias = AKSO.db.raw('??', 'table_field_' + formField.name);

			// Add join clauses to the query
			const fieldTable = 'forms_data_fields_' + formField.type;
			participantQuery.leftJoin(AKSO.db.raw('?? AS ??', [ fieldTable, fieldTableAlias ]), function () {
				this.on(AKSO.db.raw('??.formId', fieldTableAlias), 'd.formId')
					.on(AKSO.db.raw('??.name', fieldTableAlias), AKSO.db.raw('?', formField.name))
					.on(AKSO.db.raw('??.dataId', fieldTableAlias), 'd.dataId');
			});
			selectFields.push(AKSO.db.raw(`??.value AS ${escapeId('data.' + formField.name, true)}`, fieldTableAlias));
		}
		participantQuery.first(selectFields);
		const participantData = await participantQuery;
		if (!participantData) { return res.sendStatus(404); }

		// Make sure the sequenceId isn't taken by another participant
		if ('sequenceId' in req.body) {
			const sequenceIdTaken = await AKSO.db('congresses_instances_participants')
				.where({
					congressInstanceId: req.params.instanceId,
					sequenceId: req.body.sequenceId
				})
				.whereNot('dataId', req.params.dataId)
				.first(1);
			if (sequenceIdTaken) {
				return res.status(423).type('text/plain')
					.send('sequenceId already registered with another dataId');
			}
		}

		const fakeReq = {
			query: { fields: Object.keys(parSchema.fields) }
		};
		const oldData = new CongressParticipantResource(participantData, fakeReq, {}, formFieldsObj).obj.data;

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

		let price = undefined;
		if (req.body.data) {
			const formValues = {
				'@created_time': participantData.createdTime,
				'@edited_time': participantData.editedTime,
				'@upfront_time': null, // TODO
				'@is_member': req.body.codeholderId ?
					await isActiveMember(req.body.codeholderId, congressData.dateFrom) : false
			};
			const participantMetadata = await validateDataEntry({
				formData,
				data: req.body.data,
				oldData: oldData,
				addFormValues: formValues,
				allowInvalidData: req.body.allowInvalidData
			});

			// Replace the participant's data
			await insertFormDataEntry(formData.form, formData.formId, req.params.dataId, req.body.data);

			price = null;
			if (formData.price_var) {
				price = participantMetadata.evaluate('price');
			}
		}	

		// Update the participant
		await AKSO.db('congresses_instances_participants')
			.where('dataId', req.params.dataId)
			.update({
				codeholderId: req.body.codeholderId,
				approved: req.body.approved,
				notes: req.body.notes,
				price: price,
				cancelledTime: req.body.cancelledTime,
				sequenceId: req.body.sequenceId
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
