import SimpleResource from './simple-resource';
import ipaddr from 'ipaddr.js';

class HttpLogResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if (obj.ip) { obj.ip = ipaddr.fromByteArray(obj.ip).toString(); }
		if (obj.resTime) { obj.resTime = parseFloat(obj.resTime); }
	}
}

export default HttpLogResource;
