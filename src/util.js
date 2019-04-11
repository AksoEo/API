import Handlebars from 'handlebars';

/**
 * Traverses through an object recursively and calls a replacement function
 * @param  {Object}   obj               The object to iterate over
 * @param  {Function} replacer          The function to call, must return the new object or undefined to leave the object as is and stop iteration
 * @param  {boolean}  [toJSON]          Whether to call toJSON on each object after the replacer function, default to true
 * @param  {boolean}  [removeUndefined] Whether to remove undefined attributes
 * @return {Object} The object with replacements made
 */
export function replaceObject (obj, replacer, toJSON = true, removeUndefined = true) {
	const res = replacer(obj);
	if (res === undefined) { return obj; }
	obj = res;
	if (toJSON && obj != null && typeof obj.toJSON === 'function') { obj = obj.toJSON(); }
	if (Array.isArray(obj)) {
		return obj.map(x => replaceObject(x, replacer));
	} else if (typeof obj === 'object' && obj !== null) {
		const entries = Object.entries(obj)
			.filter(([k, v]) => !removeUndefined || v !== undefined) // eslint-disable-line no-unused-vars
			.map(([k, v]) => [k, replaceObject(v, replacer)]);
		const newObj = {};
		for (let entry of entries) {
			newObj[entry[0]] = entry[1];
		}
		return newObj;
	}
	return obj;
}

/**
 * Promise.all but for an object instead of an array
 * @param  {Object} promises string:Promise mapping
 * @return {Object} The result of all the promises
 */
export async function promiseAllObject (promises) {
	const responseArray = await Promise.all(Object.values(promises));
	const responseObject = {};

	const keys = Object.keys(promises);
	for (let i in responseArray)  {
		responseObject[keys[i]] = responseArray[i];
	}

	return responseObject;
}

Handlebars.registerHelper('url', options => {
	return options.data.root.domain + options.fn(this);
});

/**
 * Renders a template using handlebars
 * @param  {string}  tmpl       The template data
 * @param  {Object}  view       The view
 * @param  {boolean} [noEscape] If true nothing is escaped
 * @return {string} The rendered template
 */
export function renderTemplate (tmpl, view = {}, noEscape = false) {
	return Handlebars.compile(tmpl, noEscape)(view);
}
