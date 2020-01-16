import QueryUtil from 'akso/lib/query-util';
import CongressParticipantResource from 'akso/lib/resources/congress-participant-resource';

import parSchema from './schema';

async function getFormMetaData (req, res) {
	const schema = {
		...parSchema,
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
		schema.fields[filterFieldName] = flags;

		const fieldTableAlias = AKSO.db.raw('??', 'table_field_' + formField.name);
		schema.fieldAliases[filterFieldName] = () => AKSO.db.raw('??.value', fieldTableAlias);

		// Add join clauses to the query
		const fieldTable = 'forms_data_fields_' + formField.type;
		query.leftJoin(AKSO.db.raw('?? AS ??', [ fieldTable, fieldTableAlias ]), function () {
			this.on(AKSO.db.raw('??.formId', fieldTableAlias), 'd.formId')
				.on(AKSO.db.raw('??.name', fieldTableAlias), AKSO.db.raw('?', formField.name))
				.on(AKSO.db.raw('??.dataId', fieldTableAlias), 'd.dataId');
		});
	}

	return { schema, query, formFields };
}

export default {
	schema: async (req, res) => (await getFormMetaData(req, res)).schema,

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('congresses')
			.innerJoin('congresses_instances', 'congressId', 'congresses.id')
			.where({
				congressId: req.params.congressId,
				'congresses_instances.id': req.params.instanceId
			})
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.participants.read.' + orgData.org)) { return res.sendStatus(403); }

		const formMetaData = await getFormMetaData(req, res);
		
		const formFieldsObj = {};
		for (const field of formMetaData.formFields) {
			formFieldsObj[field.name] = field.type;
		}

		await QueryUtil.handleCollection({
			req, res, schema: formMetaData.schema, query: formMetaData.query,
			Res: CongressParticipantResource, passToCol: [[ formFieldsObj ]]
		});
	}
};
