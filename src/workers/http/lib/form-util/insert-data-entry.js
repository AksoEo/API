import moment from 'moment-timezone';

export async function insertFormDataEntry (form, formId, dataId, data) {
	const getFormEntry = name => {
		for (const formEntry of form) {
			if (formEntry.el !== 'input') { continue; }
			if (formEntry.name === name.normalize('NFC')) {
				return formEntry;
			}
		}
	};

	await AKSO.db('forms_data')
		.insert({
			formId,
			dataId,
			createdTime: moment().unix()
		});
	const insertPromises = [];
	for (const [name, value] of Object.entries(data)) {
		const formEntry = getFormEntry(name);
		const type = formEntry.type;

		let safeValue = value;
		if (type === 'boolean_table') {
			safeValue = JSON.stringify(value);
		}

		insertPromises.push(
			AKSO.db('forms_data_fields_' + type)
				.insert({
					formId,
					dataId,
					name: formEntry.name,
					value: safeValue
				})
		);
	}

	await Promise.all(insertPromises);
}
