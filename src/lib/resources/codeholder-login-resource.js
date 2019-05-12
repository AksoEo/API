import SimpleResource from './simple-resource';
import ipaddr from 'ipaddr.js';

/**
 * A resource representing a codeholder login entry
 */
class CodeholderLoginResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if (obj.ip) {
			obj.ip = ipaddr.fromByteArray(obj.ip).toString();
			try {
				obj.ip = ipaddr.process(obj.ip).toString();
			} catch (e) { null; } // do nothing
		}
		if (obj.ll) {
			obj.ll = [ obj.ll.x, obj.ll.y ];
		}
	}
}

export default CodeholderLoginResource;
