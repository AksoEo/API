import SimpleResource from './simple-resource';

/**
 * A resource representing a country
 */
class CountryResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('enabled' in obj) { obj.enabled = !!obj.enabled; }
	}
}

export default CountryResource;
