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
				},
				checkInTime: {
					type: 'integer',
					format: 'uint64',
					nullable: true
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
		if (!req.hasPermission('congress_instances.participants.update.' + congressData.org)) { return res.sendStatus(403); }

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

		const fakeReq = {
			query: { fields: Object.keys(parSchema.fields) }
		};
		const oldData = new CongressParticipantResource(participantData, fakeReq, {}, formFieldsObj).obj.data;

		await manualDataValidation(req, res, formData, true);

		let price = undefined;
		if (req.body.data || req.body.customFormVars) {
			const formValues = {
				'@created_time': participantData.createdTime,
				'@edited_time': participantData.editedTime,
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
			} else {
				const customFormVars = await AKSO.db('congresses_instances_participants_customFormVars')
					.select('name', 'value')
					.where('dataId', req.params.dataId);
				for (const customFormVar of customFormVars) {
					formValues[customFormVar.name.substring(1)] = customFormVar.value;
				}
			}

			const participantMetadata = await validateDataEntry({
				formData,
				data: req.body.data ?? oldData,
				oldData: oldData,
				addFormValues: formValues,
				allowInvalidData: req.body.allowInvalidData
			});

			if (req.body.data) {
				// Replace the participant's data
				await insertFormDataEntry(formData.form, formData.formId, req.params.dataId, req.body.data);
			}

			price = null;
			if (formData.price_var) {
				price = participantMetadata.evaluate(formData.price_var);
			}
		}	

		// Update the participant
		const trx = await req.createTransaction();
		await trx('congresses_instances_participants')
			.where('dataId', req.params.dataId)
			.update({
				codeholderId: req.body.codeholderId,
				approved: req.body.approved,
				notes: req.body.notes,
				price: price,
				cancelledTime: req.body.cancelledTime,
				sequenceId: req.body.sequenceId,
				checkInTime: req.body.checkInTime,
			});
		if (req.body.customFormVars) {
			await trx('congresses_instances_participants_customFormVars')
				.where('dataId', req.params.dataId)
				.delete();

			if (Object.keys(req.body.customFormVars).length) {
				await trx('congresses_instances_participants_customFormVars')
					.where('dataId', req.params.dataId)
					.insert(
						Object.entries(req.body.customFormVars)
							.map(([name, value]) => {
								return {
									congressInstanceId: req.params.instanceId,
									dataId: req.params.dataId,
									name,
									value: JSON.stringify(value),
								};
							})
					);
			}
		}
		await trx.commit();

		res.sendStatus(204);
	}
};
