import SimpleResource from './simple-resource';

/**
 * A resource representing a delegation application
 */
class DelegationApplicationResource extends SimpleResource {
	constructor (obj, req, schema) {
		super(obj);
		const fields = [ ...(req.query.fields || schema.defaultFields) ];

		if (obj.cities) {
			if (obj.cities[0] === null) { obj.cities = null; }
			else { obj.cities = obj.cities.map(x => `Q${x}`); }
		}

		obj.tos = {
			docDataProtectionUEA: fields.includes('tos.docDataProtectionUEA') ? !!obj.tos_docDataProtectionUEA : undefined,
			docDelegatesUEA: fields.includes('tos.docDelegatesUEA') ? !!obj.tos_docDelegatesUEA : undefined,
			docDelegatesDataProtectionUEA: fields.includes('tos.docDelegatesDataProtectionUEA') ? !!obj.tos_docDelegatesDataProtectionUEA : undefined,
			paperAnnualBook: fields.includes('tos.paperAnnualBook') ? !!obj.tos_paperAnnualBook : undefined
		};
		const tosIsEmpty = !Object.values(obj.tos)
			.filter(x => x)
			.length;
		if (tosIsEmpty) {
			delete obj.tos;
		}

		fields.push('tos');
		this.removeUnnecessary(fields);
	}
}

export default DelegationApplicationResource;
