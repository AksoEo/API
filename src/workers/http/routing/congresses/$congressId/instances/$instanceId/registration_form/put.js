import AKSOCurrency from 'akso/lib/enums/akso-currency';
import CongressParticipantResource from 'akso/lib/resources/congress-participant-resource';
import { formSchema, parseForm, setFormFields, validateDataEntry} from 'akso/workers/http/lib/form-util';
import { isActiveMember } from 'akso/workers/http/lib/codeholder-util';
import { escapeId } from 'mysql2';
import { BOOL } from '@tejo/akso-script';
import { schema as parSchema } from '../participants/schema';

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

		// Obtain the existing form if one exists
		const existingRegistrationForm = await AKSO.db('congresses_instances_registrationForm')
			.where('congressInstanceId', req.params.instanceId)
			.first('formId', 'form');

		// Validate the form
		const formValues = {
			'@is_member': BOOL
		};
		const parsedForm = await parseForm({
			form: req.body.form,
			existingForm: existingRegistrationForm ? existingRegistrationForm.form : undefined,
			formValues
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
			identifierCountryCode: req.body.identifierCountryCode
		};
		const data = {
			...rawData,
			form: JSON.stringify(rawData.form)
		};
		if (existingRegistrationForm) {
			await AKSO.db('congresses_instances_registrationForm')
				.where('congressInstanceId', req.params.instanceId)
				.update(data);
		} else {
			await AKSO.db('congresses_instances_registrationForm')
				.insert({
					...data,
					congressInstanceId: req.params.instanceId
				});
		}

		res.sendStatus(204);

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

			const participants = await participantQuery;
			await Promise.all(participants.map(async participantObj => {
				const fakeReq = {
					query: { fields: Object.keys(parSchema.fields) }
				};
				const participant = new CongressParticipantResource(participantObj, fakeReq, {}, formFieldsObj);		

				const formValues = {
					'@created_time': participant.obj.createdTime,
					'@edited_time': participant.obj.editedTime,
					'@is_member': participant.obj.codeholderId ?
						await isActiveMember(participant.obj.codeholderId, congressData.dateFrom) : false
				};

				// This should never fail assuming data migration succeeded
				const participantMetadata = await validateDataEntry({
					formData: rawData,
					data: participant.obj.data,
					addFormValues: formValues, 
					allowInvalidData: true
				});
				const price = participantMetadata.evaluate('price');
				
				if (price !== participant.obj.price) {
					await AKSO.db('congresses_instances_participants')
						.where('dataId', participant.obj.dataId)
						.update('price', price);
				}
			}));
		}
	}
};
