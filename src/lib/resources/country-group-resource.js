import SimpleResource from './simple-resource';

/**
 * A resource representing a country group
 */
class CountryGroupResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if (obj.countries) { obj.countries = obj.countries.split(','); }
		else if (obj.countries === null) { obj.countries = []; }
	}
}

export default CountryGroupResource;
