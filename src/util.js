import Handlebars from 'handlebars';

import path from 'path';
import MarkdownIt from 'markdown-it';
import MarkdownItMultimdTable from 'markdown-it-multimd-table';

import { formatCurrency } from 'akso/lib/akso-script-util';

Handlebars.registerHelper('url', options => {
	let url = options.fn(this);
	if (url[0] !== '/') { url = '/' + url; }
	return options.data.root.domain + url;
});
Handlebars.registerHelper('img', options => {
	return new URL(path.join('assets/img', options.fn(this)), AKSO.conf.http.outsideAddress).toString();
});
Handlebars.registerHelper('breaklines', text => {
	text = Handlebars.Utils.escapeExpression(text)
		.replace(/(\r\n|\n|\r)/gm, '<br>');
	return new Handlebars.SafeString(text);
});
Handlebars.registerHelper('and', function(a, b) {
	return a && b;
});
Handlebars.registerHelper('or', function(a, b) {
	return a || b;
});
Handlebars.registerHelper('mod', function(a, b) {
	return a % b;
});
Handlebars.registerHelper('if_eq', function(a, b, opts) {
	if(a == b) { return opts.fn(this); }
	else { return opts.inverse(this); }
});
Handlebars.registerHelper('currency_fmt', function (amt, currency, currencyName = true) {
	return formatCurrency(amt, currency, currencyName);
});
Handlebars.registerHelper('markdown_fmt', function (mdStr, rules) {
	if (mdStr === null) { return ''; }
	const markdownIt = new MarkdownIt('zero', {
		breaks: true,
	}).use(MarkdownItMultimdTable, {
		multiline: true,
		rowspan: true,
		headerless: true,
	});
	markdownIt.enable([
		'newline',
		...rules.split(','),
	]);
	return new Handlebars.SafeString(markdownIt.render(mdStr));
});

export function getSafeHandlebarsString (str) {
	return new Handlebars.SafeString(str);
}

/**
 * Renders a template using handlebars
 * @param  {string}  tmpl       The template data
 * @param  {Object}  view       The view
 * @param  {boolean} [escape]   Whether to escape HTML
 * @return {string} The rendered template
 */
export function renderTemplate (tmpl, view = {}, escape = true) {
	return Handlebars.compile(tmpl, { noEscape: !escape })(view);
}

export function arrToObjByKey (arr, _key, pick = null) {
	const obj = {};
	for (const row of arr) {
		let key;
		if (typeof _key === 'function') {
			key = _key(row);
		} else {
			key = row[_key];
		}
		if (!(key in obj)) {
			obj[key] = [];
		}
		let val;
		if (pick) {
			if (typeof pick === 'function') {
				val = pick(row);
			} else {
				val = row[pick];
			}
		} else {
			val = row;
		}
		obj[key].push(val);
	}
	return obj;
}

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

/**
 * Creates a knex transaction for use with async await
 * @return {knex.Transaction}
 */
export function createTransaction(db = AKSO.db) {
	return new Promise((resolve, reject) => db.transaction(resolve).catch(reject));
}

/**
 * Silently rolls back a knex transaction
 * @param {knex.Transaction} trx
 */
export async function rollbackTransaction (trx) {
	await trx.rollback();
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

export function escapeHTML(s) { 
	return s
		.toString()
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
