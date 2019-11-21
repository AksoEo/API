import SimpleResource from './simple-resource';

/**
 * A resource representing an address label template
 */
class AddressLabelTemplateResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('drawOutline' in obj) { obj.drawOutline = !!obj.drawOutline; }
	}
}

export default AddressLabelTemplateResource;
