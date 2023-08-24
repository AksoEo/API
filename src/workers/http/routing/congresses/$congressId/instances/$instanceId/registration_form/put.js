import AKSOCurrency from 'akso/lib/enums/akso-currency';
import CongressParticipantResource from 'akso/lib/resources/congress-participant-resource';
import { formSchema, parseForm, setFormFields, validateDataEntry} from 'akso/workers/http/lib/form-util';
import { isActiveMember } from 'akso/workers/http/lib/codeholder-util';
import { escapeId } from 'mysql2';
import { schema as parSchema, formValues } from '../participants/schema';
import { union as ascUnion, BOOL, NUMBER, STRING, NULL } from '@tejo/akso-script';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				allowUse: {
					type: 'boolean',
					default: true
				},
				allowGuests: {
					type: 'boolean',
					default: false
				},
				editable: {
					type: 'boolean',
					default: true
				},
				cancellable: {
					type: 'boolean',
					default: true
				},
				manualApproval: {
					type: 'boolean',
					default: false
				},
				sequenceIds: {
					type: 'object',
					nullable: true,
					properties: {
						startAt: {
							type: 'integer',
							format: 'int32',
							default: 1
						},
						requireValid: {
							type: 'boolean',
							default: true
						}
					},
					additionalProperties: false
				},
				price: {
					type: 'object',
					nullable: true,
					properties: {
						currency: {
							type: 'string',
							enum: AKSOCurrency.all
						},
						var: {
							type: 'string',
							minLength: 1,
							maxLength: 40
						},
						minUpfront: {
							type: 'integer',
							format: 'uint32',
							nullable: true
						}
					},
					required: [
						'currency',
						'var'
					],
					additionalProperties: false
				},
				customFormVars: {
					type: 'object',
					minProperties: 0,
					maxProperties: 64,
					patternProperties: {
						'^@@v_[\\w\\-:ĥŝĝĉĵŭ]{1,18}$': {
							type: 'object',
							properties: {
								type: {
									type: 'string',
									enum: [
										'boolean', 'number', 'text',
									],
								},
								oldName: {
									type: 'string',
									pattern: '^@@v_[\\w\\-:ĥŝĝĉĵŭ]{1,18}$',
								},
								default: {
									oneOf: [
										{ type: 'boolean' },
										{ type: 'number' },
										{ type: 'null' },
										{
											type: 'string',
											minLength: 1,
											maxLength: 8192,
										},
									]
								},
							},
							required: [ 'type', 'default' ],
							additionalProperties: false,
						},
					},
					additionalProperties: false,
				},
				form: formSchema,
				identifierName: {
					type: 'string',
					minLength: 1,
					maxLength: 40
				},
				identifierEmail: {
					type: 'string',
					minLength: 1,
					maxLength: 40
				},
				identifierCountryCode: {
					type: 'string',
					nullable: true,
					minLength: 1,
					maxLength: 40
				},
				confirmationNotifTemplateId: {
					type: 'integer',
					format: 'uint32',
					nullable: true,
				},
			},
			required: [
				'form',
				'identifierEmail',
				'identifierName'
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
		if (!req.hasPermission('congress_instances.update.' + congressData.org)) { return res.sendStatus(403); }

		// Make sure confirmationNotifTemplateId is valid, if present
		if (typeof req.body.confirmationNotifTemplateId === 'number') {
			const notifTemplateExists = await AKSO.db('notif_templates')
				.first(1)
				.where({
					id: req.body.confirmationNotifTemplateId,
					intent: 'congress_registration',
					org: congressData.org,
				});
			if (!notifTemplateExists) {
				return res.status(400)
					.send('Invalid confirmationNotifTemplateId');
			}
		}

		// Obtain the existing form if one exists
		const existingRegistrationForm = await AKSO.db('congresses_instances_registrationForm')
			.where('congressInstanceId', req.params.instanceId)
			.first('formId', 'form', 'price_currency');

		// If changing currency
		if (existingRegistrationForm && req.body.price?.currency !== existingRegistrationForm.price_currency) {
			// Are there participants with a non-zero amountPaid already?
			const hasParticipants = await AKSO.db('view_congresses_instances_participants')
				.first(1)
				.where('amountPaid', '>', 0)
				.where('congressInstanceId', req.params.instanceId);
			if (hasParticipants) {
				return res.type('text/plain').status(400)
					.send('price.currency may not be changed as long as there are participants with a non-zero amountPaid')
			}
		}

		// Validate the form
		const customFormVarTypeDefs = {};
		for (const [rawName, customFormVar] of Object.entries(req.body.customFormVars ?? {})) {
			const name = rawName.substring(1);
			switch (customFormVar.type) {
			case 'boolean': {
				customFormVarTypeDefs[name] = ascUnion([ NULL, BOOL ]);
				break;
			}
			case 'number': {
				customFormVarTypeDefs[name] = ascUnion([ NULL, NUMBER ]);
				break;
			}
			case 'text': {
				customFormVarTypeDefs[name] = ascUnion([ NULL, STRING ]);
				break;
			}
			}
		}

		const parsedForm = await parseForm({
			form: req.body.form,
			existingForm: existingRegistrationForm ? existingRegistrationForm.form : undefined,
			formValues: {
				...customFormVarTypeDefs,
				...formValues,
			},
		});
 
		if (req.body.price) {
			// Validate price var
			try {
				parsedForm.validateDefinition(req.body.price.var);
			} catch (e) {
				const err = new Error(`The AKSO Script for the price variable ${req.body.price.var} errored: ${e.message}`);
				err.statusCode = 400;
				throw err;
			}
		}

		try {
			parsedForm.validateDefinition(req.body.identifierName);
		} catch (e) {
			const err = new Error(`The AKSO Script for identifierName ${req.body.identifierName} errored: ${e.message}`);
			err.statusCode = 400;
			throw err;
		}

		try {
			parsedForm.validateDefinition(req.body.identifierEmail);
		} catch (e) {
			const err = new Error(`The AKSO Script for identifierEmail ${req.body.identifierEmail} errored: ${e.message}`);
			err.statusCode = 400;
			throw err;
		}

		if (req.body.identifierCountryCode) {
			try {
				parsedForm.validateDefinition(req.body.identifierCountryCode);
			} catch (e) {
				const err = new Error(`The AKSO Script for identifierCountryCode ${req.body.identifierCountryCode} errored: ${e.message}`);
				err.statusCode = 400;
				throw err;
			}
		}

		// Validate custom form vars
		const oldCustomFormVars = await AKSO.db('congresses_instances_registrationForm_customFormVars')
			.select('name', 'type')
			.where('congressInstanceId', req.params.instanceId);
		const oldCustomFormVarsObj = {};
		for (const oldCustomFormVar of oldCustomFormVars) {
			oldCustomFormVarsObj[oldCustomFormVar.name] = oldCustomFormVar.type;
		}
		for (const [name, customFormVar] of Object.entries(req.body.customFormVars ?? {})) {
			if (customFormVar.oldName) {
				if (!(customFormVar.oldName in oldCustomFormVarsObj)) {
					const err = new Error(`oldName ${customFormVar.oldName} in customFormVars does not exist`);
					err.statusCode = 400;
					throw err;
				}
				if (customFormVar.type !== oldCustomFormVarsObj[customFormVar.oldName]) {
					const err = new Error(`${customFormVar.oldName} does not have the same type as new custom form var ${name} in customFormVars`);
					err.statusCode = 400;
					throw err;
				}
			}
			if (!(
				customFormVar.default === null ||
				( customFormVar.type === 'boolean' && typeof customFormVar.default === 'boolean' ) ||
				( customFormVar.type === 'number' && typeof customFormVar.default === 'number' ) ||
				( customFormVar.type === 'text' && typeof customFormVar.default === 'string' )
			)) {
				const err = new Error(`Type mismatch in custom form var ${name}`);
				err.statusCode = 400;
				throw err;
			}
		}

		// Create Form if it doesn't already exists
		let formId;
		if (existingRegistrationForm) {
			formId = existingRegistrationForm.formId;
		} else {
			formId = (await AKSO.db('forms').insert({}))[0];
		}

		// Populate forms_fields
		await setFormFields(formId, req.body.form, parsedForm);

		const rawData = {
			allowUse: req.body.allowUse,
			allowGuests: req.body.allowGuests,
			editable: req.body.editable,
			cancellable: req.body.cancellable,
			manualApproval: req.body.manualApproval,
			form: req.body.form,
			sequenceIds_startAt: req.body.sequenceIds ? req.body.sequenceIds.startAt : null,
			sequenceIds_requireValid: req.body.sequenceIds ? req.body.sequenceIds.requireValid : null,
			price_currency: req.body.price ? req.body.price.currency : null,
			price_var: req.body.price ? req.body.price.var : null,
			price_minUpfront: req.body.price ? req.body.price.minUpfront : null,
			formId,
			identifierName: req.body.identifierName,
			identifierEmail: req.body.identifierEmail,
			identifierCountryCode: req.body.identifierCountryCode,
			confirmationNotifTemplateId: req.body.confirmationNotifTemplateId,
		};
		const data = {
			...rawData,
			form: JSON.stringify(rawData.form)
		};

		const trx = await req.createTransaction();
		if (existingRegistrationForm) {
			await trx('congresses_instances_registrationForm')
				.where('congressInstanceId', req.params.instanceId)
				.update(data);

			// Find oldCustomFormVars that no longer exist or have been renamed
			for (const oldCustomFormVar in oldCustomFormVarsObj) {
				let found = false;
				for (const [name, customFormVar] of Object.entries(req.body.customFormVars ?? {})) {
					// Same name
					if (oldCustomFormVar === name) {
						found = true;
						// Update default
						await trx('congresses_instances_registrationForm_customFormVars')
							.where({
								congressInstanceId: req.params.instanceId,
								name,
							})
							.update('default', JSON.stringify(customFormVar.default));
						break;
					}
					// Renamed
					if (oldCustomFormVar === customFormVar.oldName) {
						found = true;
						await trx('congresses_instances_registrationForm_customFormVars')
							.where({
								congressInstanceId: req.params.instanceId,
								name: oldCustomFormVar,
							})
							.update({
								name, default: JSON.stringify(customFormVar.default),
							});
						break;
					}
				}
				if (found) { continue; }
				await trx('congresses_instances_registrationForm_customFormVars')
					.where({
						congressInstanceId: req.params.instanceId,
						name: oldCustomFormVar
					})
					.delete();
			}

			// Create new custom form vars
			const newCustomFormVars = Object.entries(req.body.customFormVars ?? {})
				// Filter out existing form vars (renamed or not)
				.filter(([name, customFormVar]) => !(customFormVar.oldName || (name in oldCustomFormVarsObj)))
				.map(([name, customFormVar]) => {
					return {
						congressInstanceId: req.params.instanceId,
						name,
						type: customFormVar.type,
						default: JSON.stringify(customFormVar.default),
					};
				});
			if (newCustomFormVars.length) {
				await trx('congresses_instances_registrationForm_customFormVars')
					.insert(newCustomFormVars);
			}
		} else {
			await trx('congresses_instances_registrationForm')
				.insert({
					...data,
					congressInstanceId: req.params.instanceId
				});
			const customFormVarsInsert = Object.entries(req.body.customFormVars ?? {})
				.map(([name, customFormVar]) => {
					return {
						congressInstanceId: req.params.instanceId,
						name,
						type: customFormVar.type,
						default: JSON.stringify(customFormVar.default),
					};
				});
			if (customFormVarsInsert.length) {
				await trx('congresses_instances_registrationForm_customFormVars')
					.insert(customFormVarsInsert);
			}
		}

		await trx.commit();

		// Recalculate prices for all participants
		if (req.body.price) {
			const participantQuery = AKSO.db('congresses_instances_participants')
				.joinRaw('INNER JOIN `forms_data` d on `d`.dataId = congresses_instances_participants.dataId')
				.where('congressInstanceId', req.params.instanceId);
			const selectFields = [ 'd.dataId', 'createdTime', 'editedTime', 'codeholderId', 'price' ];

			// Add the fields of the form
			const formFieldsObj = {};
			for (const formField of req.body.form) {
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
			participantQuery.select(selectFields);

			const customFormVarDefaults = {};
			for (const [name, customFormVar] of Object.entries(req.body.customFormVars ?? {})) {
				customFormVarDefaults[name.substring(1)] = customFormVar.default;
			}

			const participants = await participantQuery;
			await Promise.all(participants.map(async participantObj => {
				const fakeReq = {
					query: { fields: Object.keys(parSchema.fields) }
				};
				const participant = new CongressParticipantResource(participantObj, fakeReq, {}, formFieldsObj).obj;		

				const formValues = {
					...customFormVarDefaults,
					'@created_time': participant.createdTime,
					'@edited_time': participant.editedTime,
					'@is_member': participant.codeholderId ?
						await isActiveMember(participant.codeholderId, congressData.dateFrom) : false,
				};
				const customForVarOverrides = await AKSO.db('congresses_instances_participants_customFormVars')
					.select('name', 'value')
					.where('dataId', participant.dataId);
				for (const customFormVarOverride of customForVarOverrides) {
					formValues[customFormVarOverride.name.substring(1)] = customFormVarOverride.value;
				}

				// This should never fail assuming data migration succeeded
				const participantMetadata = await validateDataEntry({
					formData: rawData,
					data: participant.data,
					addFormValues: formValues, 
					allowInvalidData: true,
				});

				const price = participantMetadata.evaluate(req.body.price.var);

				if (price !== participant.price) {
					await AKSO.db('congresses_instances_participants')
						.where('dataId', participant.dataId)
						.update('price', price);
				}
			}));
		}

		res.sendStatus(204);
	}
};
