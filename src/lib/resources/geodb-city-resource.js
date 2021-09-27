import SimpleResource from './simple-resource';

/**
 * A resource representing a geo-db city
 */
class GeoDBCityResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('id' in obj) {
			obj.id = 'Q' + obj.id;
		}
	}
}

export default GeoDBCityResource;
