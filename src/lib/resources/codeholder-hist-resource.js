import SimpleResource from './simple-resource';
import CodeholderResource from './codeholder-resource';
import { histFields } from 'akso/workers/http/routing/codeholders/schema';

/**
 * A resource representing a codeholder hist entry
 */
class CodeholderHistResource extends SimpleResource {
	constructor (obj, datum) {
		super(obj);

		const metaObj = {
			modId: obj.modId,
			modBy: obj.modBy,
			modCmt: obj.modCmt,
			modTime: obj.modTime
		};
		for (let key in metaObj) {
			delete obj[key];
		}

		const dataObj = obj;
		this.obj = obj = metaObj;

		if ('val' in dataObj) {
			delete dataObj.val;
			obj.val = new CodeholderResource(dataObj, {
				query: {
					fields: histFields[datum]
				}
			});
		}
	}
}

export default CodeholderHistResource;
