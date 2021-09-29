import SimpleResource from './simple-resource';

/**
 * A resource representing a codeholder delegation
 */
class CodeholderDelegationResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);

		if (obj.cities) {
			obj.cities = obj.cities.map(x => `Q${x}`);
		}

		if (obj.tos) {
			obj.tos = {
				docDataProtectionUEA: !!obj.tos_docDataProtectionUEA,
				docDataProtectionUEATime: obj.tos_docDataProtectionUEA_time,
				docDelegatesUEA: !!obj.tos_docDelegatesUEA,
				docDelegatesUEATime: obj.tos_docDelegatesUEA_time,
				docDelegatesDataProtectionUEA: !!obj.tos_docDelegatesDataProtectionUEA,
				docDelegatesDataProtectionUEATime: obj.tos_docDelegatesDataProtectionUEA_time,
				paperAnnualBook: !!obj.tos_paperAnnualBook,
				paperAnnualBookTime: obj.tos_paperAnnualBook_time
			};
		}

		const fields = [ ...(req.query.fields || schema.defaultFields) ];
		
		// For /delegations/delegates only
		const hostingFields = [
			'hosting.maxDays',
			'hosting.maxPersons',
			'hosting.description',
			'hosting.psProfileURL'
		];
		let hasHostingField = false;
		for (const field of hostingFields) {
			if (fields.includes(field)) {
				hasHostingField = true;
				break;
			}
		}
		if (hasHostingField) {
			fields.push('hosting');
			for (const field of hostingFields) {
				const index = fields.indexOf(field);
				if (index === -1) {
					if (obj.hosting) {
						delete obj.hosting[field.split('.')[1]];
					}
				} else {
					fields.splice(index, 1);
				}
			}
		}

		this.removeUnnecessary(fields);
	}
}

export default CodeholderDelegationResource;
