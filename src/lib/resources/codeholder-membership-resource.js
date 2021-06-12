import SimpleResource from './simple-resource';

/**
 * A resource representing a codeholder membership entry
 */
class CodeholderMembershipResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('givesMembership' in obj) { obj.givesMembership = !!obj.givesMembership; }
		if ('lifetime' in obj) { obj.lifetime = !!obj.lifetime; }
		if ('canuto' in obj) { obj.canuto = !!obj.canuto; }
	}
}

export default CodeholderMembershipResource;
