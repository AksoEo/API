/**
 * Traverses through an object recursively and calls a replacement function
 * @param  {Object}   obj      The object to iterate over
 * @param  {Function} replacer The function to call, must return the new object or undefined to leave the object as is and stop iteration
 * @param  {boolean}  [toJSON] Whether to call toJSON on each object after the replacer function, default to true
 * @return {Object}            The object with replacements made
 */
export function replaceObject (obj, replacer, toJSON = true) {
	const res = replacer(obj);
	if (res === undefined) { return obj; }
	obj = res;
	if (toJSON && obj != null && typeof obj.toJSON === 'function') { obj = obj.toJSON(); }
	if (Array.isArray(obj)) {
		return obj.map(x => replaceObject(x, replacer));
	} else if (typeof obj === 'object' && obj !== null) {
		const entries = Object.entries(obj).map(([k, v]) => [k, replaceObject(v, replacer)]);
		const newObj = {};
		for (let entry of entries) {
			newObj[entry[0]] = entry[1];
		}
		return newObj;
	}
	return obj;
}
