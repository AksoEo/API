import { createTransaction } from 'akso/util';

export async function setFormFields (formId, form, parsedForm) {
	const trx = await createTransaction();

	// Delete fields
	if (parsedForm.deletionFields.length) {
		await trx('forms_fields')
			.where({ formId })
			.whereIn('name', parsedForm.deletionFields)
			.delete();
	}

	// Rename fields
	const renameFields = Object.entries(parsedForm.renameFields); // a -> b mapping
	// rename a -> x
	for (const i in renameFields) {
		const [oldName] = renameFields[i];
		const tmpName = '?' + i;
		await trx('forms_fields')
			.where({
				formId,
				name: oldName
			})
			.update('name', tmpName);
	}
	// rename x -> b
	for (const i in renameFields) {
		const [,newName] = renameFields[i];
		const tmpName = '?' + i;
		await trx('forms_fields')
			.where({
				formId,
				name: tmpName
			})
			.update('name', newName);
	}

	// Migrate fields
	for (const { old: oldField, new: newField } of Object.values(parsedForm.migrationFields)) {
		// Change the field type
		await trx('forms_fields')
			.where({
				formId,
				name: newField.name
			})
			.update('type', newField.type);

		// Copy existing data
		let valueSQL = 'value';
		if (oldField.type === 'time' && newField.type === 'text') {
			valueSQL = 'CONCAT(HOUR(value), ":", MINUTE(value))';
		}
		await trx.raw(`
			INSERT INTO forms_data_fields_${newField.type} (formId, name, dataId, value)
			SELECT
				formId, name, dataId, ${valueSQL}
			FROM forms_data_fields_${oldField.type}
			WHERE
				formId = ? AND name = ?
		`, [ formId, newField.name ]);

		// Delete existing data
		await trx('forms_data_fields_' + oldField.type)
			.where({
				formId,
				name: newField.name
			});
	}

	// Create fields
	if (parsedForm.creationFields.length) {
		await trx('forms_fields')
			.insert(parsedForm.creationFields.map(formEntry => {
				return {
					formId,
					name: formEntry.name,
					type: formEntry.type	
				};
			}));
	}

	await trx.commit();
}
