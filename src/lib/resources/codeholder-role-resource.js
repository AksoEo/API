import SimpleResource from './simple-resource';

/**
 * A resource representing a codeholder role
 */
class CodeholderRoleResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('public' in obj) { obj.public = !!obj.public; }
	}
}

export default CodeholderRoleResource;
