import { memberFilter, schema as chSchema } from 'akso/workers/http/routing/codeholders/schema';

export const schema = {
	defaultFields: [ 'dataId' ],
	fields: {
		dataId: 'f',
		codeholderId: 'f',
		approved: 'f',
		notes: '',
		createdTime: 'f',
		editedTime: 'f',
		sequenceId: 'f',
		price: 'f'
	},
	fieldAliases: {
		'dataId': 'congresses_instances_participants.dataId'
	}
};

// Takes care of additional data validation for POST and PATCH
export async function manualDataValidation (req, res, formData) {
	// Require codeholderId if not allowGuests
	if (!formData.allowGuests && !('codeholderId' in req.body)) {
		const err = new Error('codeholderId is required as allowGuests is false in the registration form');
		err.statusCode = 400;
		throw err;
	}

	if ('codeholderId' in req.body) {
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
	}
}

// Handles read requests for participants
export async function getFormMetaData (req, res) {
	const dynSchema = {
		...schema,
		...{
			query: 'collection',
			body: null
		}
	};

	const formData = await AKSO.db('congresses_instances_registrationForm')
		.where('congressInstanceId', req.params.instanceId)
		.first('formId');
	if (!formData) { return res.sendStatus(404); }
	
	const formFields = await AKSO.db('forms_fields')
		.where('formId', formData.formId)
		.select('name', 'type');

	const query = AKSO.db('congresses_instances_participants')
		.joinRaw('INNER JOIN `forms_data` d on `d`.dataId = congresses_instances_participants.dataId')
		.where('congressInstanceId', req.params.instanceId);

	// Add the fields of the form
	for (const formField of formFields) {
		// Set the flags for the data field
		let flags = '';
		if (![ 'text', 'boolean_table' ].includes(formField.type)) { flags += 'f'; }
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
	}

	// TODO: Is there a reason this a separate loop
	const formFieldsObj = {};
	for (const field of formFields) {
		formFieldsObj[field.name] = field.type;
	}

	return { schema: dynSchema, query, formFields, formFieldsObj };
}
