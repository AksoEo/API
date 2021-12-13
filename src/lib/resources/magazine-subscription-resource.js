import SimpleResource from './simple-resource';

/**
 * A resource representing magazine subscription
 */
class MagazineSubscriptionResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('paperVersion' in obj) {
			obj.paperVersion = !!obj.paperVersion;
		}
	}
}

export default MagazineSubscriptionResource;
