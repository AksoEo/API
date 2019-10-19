import SimpleResource from './simple-resource';

/**
 * A resource representing a magazine edition
 */
class MagazineEditionToCResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('highlighted' in obj) { obj.highlighted = !!obj.highlighted; }
	}
}

export default MagazineEditionToCResource;
