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

		this.removeUnnecessary(req.query.fields || schema.defaultFields);
	}
}

export default CodeholderDelegationResource;
