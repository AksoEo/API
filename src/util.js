export function replaceObject (obj, cb) {
	obj = cb(obj);
	if (obj != null && obj.toJSON instanceof Function) { obj = obj.toJSON(); }
	if (Array.isArray(obj)) {
		return obj.map(x => replaceObject(x, cb));
	} else if (typeof obj === 'object' && obj !== null) {
		const entries = Object.entries(obj).map(([k, v]) => [k, replaceObject(v, cb)]);
		const newObj = {};
		for (let entry of entries) {
			newObj[entry[0]] = entry[1];
		}
		return newObj;
	}
	return obj;
}
