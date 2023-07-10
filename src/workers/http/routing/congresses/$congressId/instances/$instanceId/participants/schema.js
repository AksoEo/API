import { escapeId } from 'mysql2';

import { memberFilter, schema as chSchema } from 'akso/workers/http/routing/codeholders/schema';
import CongressParticipantResource from 'akso/lib/resources/congress-participant-resource';
import { renderTemplate } from 'akso/lib/notif-template-util';
import { sendRawMail } from 'akso/mail';
import { validateDataEntry } from 'akso/workers/http/lib/form-util';
import { BOOL, union, NUMBER, NULL } from '@tejo/akso-script';
import { isActiveMember } from 'akso/workers/http/lib/codeholder-util';

export const schema = {
	defaultFields: [ 'dataId' ],
	fields: {
		dataId: 'f',
		codeholderId: 'f',
		approved: 'f',
		notes: 's',
		createdTime: 'f',
		editedTime: 'f',
		checkInTime: 'f',
		sequenceId: 'f',
		price: 'f',
		cancelledTime: 'f',
		amountPaid: 'f',
		hasPaidMinimum: 'f',
		isValid: 'f',
		customFormVars: '',
	},
	fieldAliases: {
		'dataId': 'view_congresses_instances_participants.dataId',
		customFormVars: () => AKSO.db.raw('1'),
	},
	alwaysSelect: [
		'amountPaid',
		'approved',
		'price_minUpfront',
		'price',
		'hasPaidMinimum',
		'manualApproval',
		'cancelledTime',
		'dataId',
	]
};

export const formValues = {
	'@is_member': BOOL,
	'@created_time': union([ NUMBER, NULL ]),
	'@edited_time': union([ NUMBER, NULL ]),
}; 

// Takes care of additional data validation for POST and PATCH
export async function manualDataValidation (req, res, formData, isPatch = false) {
	const congressInstanceId = formData.congressInstanceId;
	const dataId = req.params?.dataId ?? null;

	// Require codeholderId if not allowGuests
	if (!isPatch && !formData.allowGuests && !('codeholderId' in req.body)) {
		const err = new Error('codeholderId is required as allowGuests is false in the registration form');
		err.statusCode = 400;
		throw err;
	}

	// Make sure the sequenceId isn't taken by another participant
	if ('sequenceId' in req.body && req.body.sequenceId !== null) {
		const sequenceIdTaken = await AKSO.db('congresses_instances_participants')
			.where({
				congressInstanceId,
				sequenceId: req.body.sequenceId,
			})
			.whereNot({ dataId })
			.first('dataId', 'sequenceId');
		if (sequenceIdTaken) {
			const err = new Error('sequenceId already registered with another dataId');
			err.statusCode = 423;
			throw err;
		}
	}

	if ('codeholderId' in req.body && req.body.codeholderId !== null) {
		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.body.codeholderId)
			.first(1);
		memberFilter(chSchema, codeholderQuery, req);
		if (!await codeholderQuery) {
			const err = new Error();
			err.statusCode = 404;
			throw err;
		}

		// Make sure the participant doesn't already exist
		const codeholderAlreadyExists = await AKSO.db('congresses_instances_participants')
			.where({
				congressInstanceId,
				codeholderId: req.body.codeholderId,
			})
			.whereNot({ dataId })
			.first(1);
		if (codeholderAlreadyExists) {
			const err = new Error('codeholderId already registered with another dataId');
			err.statusCode = 409;
			throw err;
		}
	}

	if ('customFormVars' in req.body) {
		// Find the custom form var def
		const customFormVars = await AKSO.db('congresses_instances_registrationForm_customFormVars')
			.select('name', 'type')
			.where({ congressInstanceId });
		const customFormVarsObj = {};
		for (const customFormVar of customFormVars) {
			customFormVarsObj[customFormVar.name] = customFormVar.type;
		}

		for (const [name, val] of Object.entries(req.body.customFormVars)) {
			if (!(name in customFormVarsObj)) {
				const err = new Error(`Unknown customFormVar ${name}`);
				err.statusCode = 400;
				throw err;
			}
			if (!(
				val === null ||
				( typeof val === 'string' && customFormVarsObj[name] === 'text' ) ||
				( typeof val === 'boolean' && customFormVarsObj[name] === 'boolean' ) ||
				( typeof val === 'number' && customFormVarsObj[name] === 'number' )
			)) {
				const err = new Error(`Type mismatch for customFormVar ${name}. Expected type=${customFormVarsObj[name]}`);
				err.statusCode = 400;
				throw err;
			}
		}
	}
}

// Handles read requests for participants
export async function getFormMetaData (instanceId) {
	const dynSchema = {
		...schema,
		...{
			query: 'collection',
			body: null
		}
	};

	const formData = await AKSO.db('congresses_instances_registrationForm')
		.where('congressInstanceId', instanceId)
		.first('*');
	if (!formData) {
		const err = new Error();
		err.statusCode = 404;
		throw err;
	}
	
	const formFields = await AKSO.db('forms_fields')
		.where('formId', formData.formId)
		.select('name', 'type');

	const query = AKSO.db('view_congresses_instances_participants')
		.leftJoin('congresses_instances_registrationForm', 'congresses_instances_registrationForm.congressInstanceId', 'view_congresses_instances_participants.congressInstanceId')
		.joinRaw('INNER JOIN `forms_data` d on `d`.dataId = view_congresses_instances_participants.dataId')
		.where('view_congresses_instances_participants.congressInstanceId', instanceId);

	// Add the fields of the form
	const formFieldsObj = {};
	for (const formField of formFields) {
		// Set the flags for the data field
		let flags = '';
		if (!([ 'text', 'boolean_table' ].includes(formField.type))) { flags += 'f'; }
		if (formField.type === 'text') { flags += 's'; }

		// Add the fields to the schema
		const filterFieldName = 'data.' + formField.name;
		dynSchema.fields[filterFieldName] = flags;

		const fieldTableAlias = AKSO.db.raw('??', 'table_field_' + formField.name);
		dynSchema.fieldAliases[filterFieldName] = () => AKSO.db.raw('??.value', fieldTableAlias);

		// Add join clauses to the query
		const fieldTable = 'forms_data_fields_' + formField.type;
		query.leftJoin(AKSO.db.raw('?? AS ??', [ fieldTable, fieldTableAlias ]), function () {
			this.on(AKSO.db.raw('??.formId', fieldTableAlias), 'd.formId')
				.on(AKSO.db.raw('??.name', fieldTableAlias), AKSO.db.raw('?', formField.name))
				.on(AKSO.db.raw('??.dataId', fieldTableAlias), 'd.dataId');
		});

		formFieldsObj[formField.name] = formField.type;
	}

	return { schema: dynSchema, query, formFields, formFieldsObj, formData };
}

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].customFormVars) { return done(); }

	const customFormVars = await AKSO.db('congresses_instances_participants_customFormVars')
		.select('dataId', 'name', 'value')
		.whereIn('dataId', arr.map(x => x.dataId));
	const customFormVarsMap = {};
	for (const customFormVar of customFormVars) {
		const dataId = customFormVar.dataId.toString('hex');
		if (!(dataId in customFormVarsMap)) {
			customFormVarsMap[dataId] = {};
		}
		customFormVarsMap[dataId][customFormVar.name] = customFormVar.value;
	}

	for (const row of arr) {
		row.customFormVars = customFormVarsMap[row.dataId.toString('hex')] ?? {};
	}

	done();
}

export async function sendParticipantConfirmationNotif (instanceId, dataId, templateId) {
	const formMetaData = await getFormMetaData(instanceId);

	formMetaData.query
		.where('d.dataId', dataId)
		.first([
			'price', 'sequenceId', 'createdTime', 'd.dataId', 'amountPaid',
			...Object.entries(formMetaData.schema.fieldAliases)
				.filter(([key]) => key.startsWith('data.'))
				.map(([key, aliasFn]) => {
					return AKSO.db.raw(`(${aliasFn()}) AS ${escapeId(key, true)}`);
				})
		]);
	const participant = new CongressParticipantResource(
		await formMetaData.query,
		{
			query: {
				fields: [ 'price', 'sequenceId', 'createdTime', 'dataId', 'amountPaid' ],
			},
		},
		null,
		formMetaData.formFieldsObj,
	).obj;

	let dataKeys = [];
	let dataMeta = [];
	let dataVals = [];
	for (const formField of formMetaData.formData.form) {
		if (!formField.el === 'input') { continue; }
		dataKeys.push(formField.name);
		dataMeta.push([ formField.type, formField.label, formField.variant ?? formField.currency ?? formField.tz ?? null ]);
		dataVals.push(participant.data[formField.name]);
	}

	const intentData = {
		'registrationEntry.price': participant.price,
		'registrationEntry.amountPaid': participant.amountPaid,
		'registrationEntry.currency': formMetaData.formData.price_currency,
		'registrationEntry.sequenceId': participant.sequenceId,
		'registrationEntry.createdTime': participant.createdTime,
		'registrationEntry.canEdit': formMetaData.formData.editable,
		'registrationEntry.dataId': participant.dataId.toString('hex'),
		'registrationEntry.dataKeys': dataKeys,
		'registrationEntry.dataMeta': dataMeta,
		'registrationEntry.dataVals': dataVals,
	};

	const congressData = await AKSO.db('congresses_instances')
		.where('id', instanceId)
		.first('dateFrom');

	const addFormValues = {
		'@created_time': participant.createdTime,
		'@edited_time': participant.editedTime,
		'@is_member': participant.codeholderId ?
			await isActiveMember(participant.codeholderId, congressData.dateFrom) : false,
	};

	// Add default custom form vars
	const defaultCustomFormVars = await AKSO.db('congresses_instances_registrationForm_customFormVars')
		.select('name', 'default')
		.where('congressInstanceId', instanceId);
	for (const defaultCustomFormVar of defaultCustomFormVars) {
		addFormValues[defaultCustomFormVar.name.substring(1)] = defaultCustomFormVar.default;
	}
	// Add custom form var overrides
	const customFormVars = await AKSO.db('congresses_instances_participants_customFormVars')
		.select('name', 'value')
		.where('dataId', participant.dataId);
	for (const customFormVar of customFormVars) {
		addFormValues[customFormVar.name.substring(1)] = customFormVar.value;
	}

	const validatedDataEntry = await validateDataEntry({
		formData: formMetaData.formData,
		data: participant.data,
		allowInvalidData: true,
		addFormValues,
	});

	const template = await AKSO.db('notif_templates')
		.where('id', templateId)
		.first('*');

	await sendRawMail({
		...await renderTemplate(template, intentData),
		to: {
			name: validatedDataEntry.evaluate(formMetaData.formData.identifierName),
			email: validatedDataEntry.evaluate(formMetaData.formData.identifierEmail),
		},
		from: {
			name: template.fromName || '',
			email: template.from
		},
	});
}
