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
Handlebars.registerHelper('breaklines', text => {
	text = Handlebars.Utils.escapeExpression(text)
		.replace(/(\r\n|\n|\r)/gm, '<br>');
	return new Handlebars.SafeString(text);
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

/**
 * Creates a knex transaction for use with async await
 * @return {knex.Transaction}
 */
export function createTransaction() {
	return new Promise((resolve, reject) => AKSO.db.transaction(resolve).catch(reject));
}

/**
 * Silently rolls back a knex transaction
 * @param {knex.Transaction} trx
 */
export async function rollbackTransaction (trx) {
	try {
		await trx.rollback(new Error('Safe rollback, not an error'));
	} catch (e) {
		// noop
	}
}

/**
 * Turns a knex insert query into a replace query
 * @param  {knex.QueryBuilder} query
 * @param  {knex.QueryBuilder} [db] The database or subquery to run the query as
 * @return {knex.Raw}
 */
export function insertAsReplace (query, db = AKSO.db) {
	return db.raw(query.toString().replace(/^INSERT/i, 'REPLACE'));
}

/**
 * Turns a knex insert query into an insert ignore query
 * @param  {knex.QueryBuilder} query
 * @param  {knex.QueryBuilder} [db] The database or subquery to run the query as
 * @return {knex.Raw}
 */
export function insertAsInsertIgnore (query, db = AKSO.db) {
	return db.raw(query.toString().replace(/^INSERT/i, 'INSERT IGNORE'));
}

// From: https://gist.github.com/dperini/729294
//
// Regular Expression for URL validation
//
// Author: Diego Perini
// Created: 2010/12/05
// Updated: 2018/09/12
// License: MIT
//
// Copyright (c) 2010-2018 Diego Perini (http://www.iport.it)
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
export const urlRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
