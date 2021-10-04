import SimpleResource from './simple-resource';

/**
 * A resource representing a codeholder delegation
 */
class CodeholderDelegationResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);
		const fields = [ ...(req.query.fields || schema.defaultFields) ];

		if (obj.cities) {
			obj.cities = obj.cities.map(x => `Q${x}`);
		}

		obj.tos = {
			docDataProtectionUEA: fields.includes('tos.docDataProtectionUEA') ? !!obj.tos_docDataProtectionUEA : undefined,
			docDataProtectionUEATime: fields.includes('tos.docDataProtectionUEATime') ? obj.tos_docDataProtectionUEA_time : undefined,
			docDelegatesUEA: fields.includes('tos.docDelegatesUEA') ? !!obj.tos_docDelegatesUEA : undefined,
			docDelegatesUEATime: fields.includes('tos.docDelegatesUEATime') ? obj.tos_docDelegatesUEA_time : undefined,
			docDelegatesDataProtectionUEA: fields.includes('tos.docDelegatesDataProtectionUEA') ? !!obj.tos_docDelegatesDataProtectionUEA : undefined,
			docDelegatesDataProtectionUEATime: fields.includes('tos.docDelegatesDataProtectionUEATime') ? obj.tos_docDelegatesDataProtectionUEA_time : undefined,
			paperAnnualBook: fields.includes('tos.paperAnnualBook') ? !!obj.tos_paperAnnualBook : undefined,
			paperAnnualBookTime: fields.includes('tos.paperAnnualBookTime') ? obj.tos_paperAnnualBook_time : undefined
		};
		const tosIsEmpty = !Object.values(obj.tos)
			.filter(x => x)
			.length;
		if (tosIsEmpty) {
			delete obj.tos;
		}
		fields.push('tos');

		const hostingFields = [
			'maxDays',
			'maxPersons',
			'description',
			'psProfileURL'
		];
		let hasHostingField = false;
		for (const field of hostingFields) {
			if (field in obj) {
				hasHostingField = true;
				break;
			}
		}
		if (hasHostingField) {
			fields.push('hosting');
			obj.hosting = {
				maxDays: obj.maxDays,
				maxPersons: obj.maxPersons,
				description: obj.description,
				psProfileURL: obj.psProfileURL
			};
		}

		this.removeUnnecessary(fields);
	}
}

export default CodeholderDelegationResource;
