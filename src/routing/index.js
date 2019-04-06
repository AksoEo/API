import express from 'express';
import Ajv from 'ajv';
import { promisify } from 'util';
const csvParse = promisify(require('csv-parse'));
import XRegExp from 'xregexp';
import { base64url } from 'rfc4648';

import { init as route$auth } from './auth';
import { init as route$perms } from './perms';
import { init as route$countries } from './countries';

const ajv = new Ajv({
	format: 'full',
	useDefaults: true,
	strictKeywords: true
});
ajv.addKeyword('isBinary', {
	modifying: true,
	validate: function (schema, data, parentSchema, dataPath, parentData, propertyName) {
		if (!schema) { return true; }

		if (typeof data === 'string') {
			parentData[propertyName] = Buffer.from(data, 'base64');
			return true;

		} else if (data instanceof Buffer) {
			return true;
		}

		return false;
	}
});
ajv.addKeyword('minBytes', {
	validate: function (schema, data) {
		const buf = Buffer.from(data);
		return buf.length >= schema;
	}
});
ajv.addKeyword('maxBytes', {
	validate: function (schema, data) {
		const buf = Buffer.from(data);
		return buf.length <= schema;
	}
});

/**
 * Sets up all http routing
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.get('/', (req, res, next) => { // eslint-disable-line no-unused-vars
		res.type('text/plain').send([
			'AKSO REST Server',
			`Version: ${AKSO.version}`
		].join('\n'));
	});

	// TOTP excluded endpoints
	router.use('/auth', route$auth());
	router.use('/perms', route$perms());

	// TOTP required endpoints
	router.use(checkTOTPRequired);

	router.use('/countries', route$countries());

	return router;
}

/**
 * Wraps an async function to ensure proper error handling in Express
 * @param  {Function} fn
 * @return {Function}
 */
export function wrap (fn) {
	return (req, res, next) => {
		const promise = fn(req, res, next);
		if (promise.catch) {
			promise.catch(err => next(err));
		}
	};
}

/**
 * Binds a method to a router with built-in schema validation
 * @param  {express.Router} router The router to bind the endpoint to
 * @param  {string}         path   The path of the endpoint relative to the router
 * @param  {string}         method The method of the endpoint
 * @param  {Object}         bind   The bind object
 */
export function bindMethod (router, path, method, bind) {
	let validateBody = null;
	if (bind.schema && bind.schema.body) {
		validateBody = ajv.compile(bind.schema.body);
	}

	const querySearchRegex = XRegExp(
		`^
		( [+-]?
    		(
				  ( "[\\p{L}\\p{N}]{3,} (\\s+[\\p{L}\\p{N}]{3,})?" \\*? )
        		| ( [\\p{L}\\p{N}]{3,} | [\\p{L}\\p{N}]+\\* )
    		)
		)

		( \\s+ [+-]?
    		(
        		  ( "[\\p{L}\\p{N}]{3,} (\\s+[\\p{L}\\p{N}]{3,})?" \\*? )
        		| ( [\\p{L}\\p{N}]{3,} | [\\p{L}\\p{N}]+\\* )
    		)
		)*
		$`,

		'x'
	);

	router[method](path, async function validate (req, res, next) {
		if (bind.schema) {
			/**
			 * query:			null for none allowed,
			 * 					String 'collection' to allow collection parameters
			 * [maxQueryLimit]: The upper bound for ?limit, defaults to 100
			 * body:			null for none allowed,
			 * 					Object for JSON schema validation
			 */

			if ('query' in bind.schema) {
				if (!bind.schema.query) {
					if (Object.keys(req.query).length) {
						const err = new Error('Endpoint expects no query params');
						err.statusCode = 400;
						return next(err);
					}
				} else if (typeof bind.schema.query === 'string') {
					const whitelist = [];

					if (bind.schema.query === 'collection') {
						whitelist.push( 'limit', 'offset', 'order', 'fields', 'search', 'filter' );
					}

					for (let key of Object.keys(req.query)) {
						if (whitelist.indexOf(key) === -1) {
							const err = new Error(`Unexpected query parameter ${key}`);
							err.statusCode = 400;
							return next(err);
						}

						if (key === 'limit') {
							if (typeof req.query.limit === 'string') {
								req.query.limit = parseInt(req.query.limit, 10);
							}

							if (!Number.isSafeInteger(req.query.limit)) {
								const err = new Error('?limit must be an integer');
								err.statusCode = 400;
								return next(err);
							}

							const upperBound = bind.schema.maxQueryLimit || 100;
							if (req.query.limit < 1 || req.query.limit > upperBound) {
								const err = new Error(`?limit must be in [1, ${upperBound}]`);
								err.statusCode = 400;
								return next(err);
							}

						} else if (key === 'offset') {
							if (typeof req.query.offset === 'string') {
								req.query.offset = parseInt(req.query.offset, 10);
							}

							if (!Number.isSafeInteger(req.query.offset) || req.query.offset < 0) {
								const err = new Error('?offset must be a non-negative integer');
								err.statusCode = 400;
								return next(err);
							}

						} else if (key === 'order') {
							if (typeof req.query.order !== 'string') {
								const err = new Error('?order must be a string');
								err.statusCode = 400;
								return next(err);
							}

							req.query.order = req.query.order.split(',').map(x => {
								const bits = x.split('.');
								return { column: bits[0], order: bits[1] };
							});
							for (let order of req.query.order) {
								if (order.column === '_relevance') {
									if (req.query.search === undefined) {
										const err = new Error('The special field _relevance may only be used when ?search is specified');
										err.statusCode = 400;
										return next(err);									
									}

								} else {
									if (bind.schema.fields[order.column] === undefined) {
										const err = new Error(`Unknown field ${order.column} used in ?order`);
										err.statusCode = 400;
										return next(err);
									}

									if (bind.schema.fields[order.column].indexOf('f') === -1) {
										const err = new Error(`The field ${order.column} cannot be used in ?order as it's not filterable`);
										err.statusCode = 400;
										return next(err);
									}
								}

								if (order.order === undefined) {
									order.order = 'asc';
								}

								if (order.order !== 'asc' && order.order !== 'desc') {
									const err = new Error(`Unknown direction ${order.order} used in ?order`);
									err.statusCode = 400;
									return next(err);
								}
							}

						} else if (key === 'fields') {
							if (typeof req.query.fields !== 'string') {
								const err = new Error('?fields must be a string');
								err.statusCode = 400;
								return next(err);
							}

							req.query.fields = req.query.fields.split(',');
							for (let field of req.query.fields) {
								if (bind.schema.fields[field] === undefined) {
									const err = new Error(`Unknown field ${field} used in ?fields`);
									err.statusCode = 400;
									return next(err);
								}
							}

						} else if (key === 'search') {
							if (typeof req.query.search !== 'string') {
								const err = new Error('?search must be a string');
								err.statusCode = 400;
								return next(err);
							}

							let csvParsed;
							try {
								csvParsed = (await csvParse(req.query.search, { to: 1 }))[0];
							} catch (e) {
								const err = new Error('?search must be a valid csv string');
								err.statusCode = 400;
								return next(err);
							}

							if (!csvParsed || csvParsed.length < 2) {
								const err = new Error('?search must contain at least two columns');
								err.statusCode = 400;
								return next(err);
							}

							req.query.search = {
								query: csvParsed[0].trim(),
								cols: csvParsed.slice(1)
							};

							if (!querySearchRegex.test(req.query.search.query)) {
								const err = new Error('Invalid query in ?search');
								err.statusCode = 400;
								return next(err);
							}

							for (let col of req.query.search.cols) {
								if (bind.schema.fields[col] === undefined) {
									const err = new Error(`Unknown field ${col} used in ?search`);
									err.statusCode = 400;
									return next(err);
								}

								if (bind.schema.fields[col].indexOf('s') === -1) {
									const err = new Error(`The field ${col} cannot be used in ?search as it's not searchable`);
									err.statusCode = 400;
									return next(err);
								}
							}

						} else if (key === 'filter') {
							if (typeof req.query.filter === 'string') {
								if (req.query.filter.charAt(0) !== '{') { // treat as base64url
									try {
										req.query.filter = Buffer.from(base64url.parse(req.query.filter, { loose: true })).toString();
									} catch (e) {
										const err = new Error('Invalid base64url provided in ?filter');
										err.statusCode = 400;
										return next(err);
									}
								}
								try {
									req.query.filter = JSON.parse(req.query.filter);
								} catch (e) {
									const err = new Error('Invalid JSON encountered in ?filter');
									err.statusCode = 400;
									return next(err);
								}
							}
							if (typeof req.query.filter !== 'object' || req.query.filter instanceof Array) {
								const err = new Error('?filter must be a basic JSON object');
								err.statusCode = 400;
								return next(err);
							}
							req.originalQuery.filter = {...req.query.filter}; // to improve logging legibility
						}
					}
				}
			}

			if ('body' in bind.schema) {
				if (!bind.schema.body) {
					if (req.body instanceof Buffer && req.body.length || Object.keys(req.body).length) {
						const err = new Error('Endpoint expects no body');
						err.statusCode = 400;
						return next(err);
					}
				} else {
					if (!validateBody(req.body)) {
						res.status(400).sendObj(validateBody.errors);
						return;
					}
				}
			}
		}

		next();

	}, wrap(bind.run));
}

/**
 * Express middelware to ensure TOTP is used if required
 * @param  {express.Request}  req
 * @param  {express.Response} res
 * @param  {Function}         next
 */
export async function checkTOTPRequired (req, res, next) {
	if (req.user && req.user.isUser() && !req.session.totp) {
		const totpData = await AKSO.db.first(1).from('codeholders_totp').where('codeholderId', req.user.user);
		const totpSetUp = !!totpData;

		if (!totpSetUp && !req.hasPermission('admin')) { return next(); }

		const err = new Error('TOTP must be used');
		err.statusCode = 401;
		return next(err);
	}

	next();
}
