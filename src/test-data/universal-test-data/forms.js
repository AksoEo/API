export async function createForms () {
	await AKSO.db('forms')
		.insert([
			{
				id: 1
			}
		]);

	await AKSO.db('forms_fields')
		.insert([
			/*eslint-disable */
			{"formId":"1","name":"tos","type":"boolean"},
			{"formId":"1","name":"manĝoj","type":"boolean_table"},
			{"formId":"1","name":"birthdate","type":"date"},
			{"formId":"1","name":"manĝo","type":"enum"},
			{"formId":"1","name":"money","type":"money"},
			{"formId":"1","name":"cake","type":"number"},
			{"formId":"1","name":"email","type":"text"},
			{"formId":"1","name":"alvenhoro","type":"time"}
			/*eslint-enable */
		]);
}
