import SimpleResource from './simple-resource';

/**
 * A resource representing a membership category
 */
class MembershipCategoryResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('givesMembership' in obj) { obj.givesMembership = !!obj.givesMembership; }
		if ('lifetime' in obj) { obj.lifetime = !!obj.lifetime; }
	}
}

export default MembershipCategoryResource;
