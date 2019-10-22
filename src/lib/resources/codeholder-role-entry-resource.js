import SimpleResource from './simple-resource';

/**
 * A resource representing a codeholder role entry
 */
class CodeholderRoleEntryResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('isActive' in obj) { obj.isActive = !!obj.isActive; }

		if ('roleId' in obj || 'name' in obj || 'description' in obj) {
			obj.role = {
				id: obj.roleId,
				name: obj.name,
				description: obj.description
			};
			obj.roleId = obj.name = obj.description = undefined;
		}
	}
}

export default CodeholderRoleEntryResource;
