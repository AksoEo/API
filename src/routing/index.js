import express from 'express';
import Ajv from 'ajv';
import AjvMergePatch from 'ajv-merge-patch';
import { promisify } from 'util';
const csvParse = promisify(require('csv-parse'));
import XRegExp from 'xregexp';
import { base64url } from 'rfc4648';
import multer from 'multer';
import os from 'os';
import fs from 'pn/fs';
import bytesUtil from 'bytes';
import msgpack from 'msgpack-lite';

import { urlRegex } from '../util';

import { init as route$auth } from './auth';
import { init as route$clients } from './clients';
import { init as route$perms } from './perms';
import { init as route$codeholders } from './codeholders';
import { init as route$countries } from './countries';
import { init as route$country_groups } from './country_groups';
import { init as route$http_log } from './http_log';
import { init as route$membership_categories } from './membership_categories';
import { init as route$queries } from './queries';

const ajv = new Ajv({
	format: 'full',
	useDefaults: true,
	strictKeywords: true,
	nullable: true
});
AjvMergePatch(ajv);
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
ajv.addFormat('year', {
	type: 'number',
	validate: function (val) {
		return val >= 1901 && val <= 2155; // https://dev.mysql.com/doc/refman/5.7/en/year.html
	}
});
ajv.addFormat('tel', {
	type: 'number',
	validate: /^\+[a-z0-9]{1,49}$/i
});
ajv.addFormat('safe-uri', {
	type: 'string',
	validate: function (val) {
		if (!urlRegex.test(val)) { return false; }
		let parsedURL;
		try { parsedURL = new URL(val); }
		catch (e) { return false; }
		if (parsedURL.username) { return false; }
		if (parsedURL.password) { return false; }
		if (parsedURL.protocol !== 'http:' && parsedURL.protocol !== 'https:') { return false; }
		return true;
	}
});
ajv.addFormat('int16', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= -(2**15) && val < 2**15;
	}
});
ajv.addFormat('uint16', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= 0 && val < 2**16;
	}
});
ajv.addFormat('int32', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= -(2**31) && val < 2**31;
	}
});
ajv.addFormat('uint32', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= 0 && val < 2**32;
	}
});
ajv.addFormat('int64', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= -(2**63) && val < 2**63;
	}
});
ajv.addFormat('uint32', {
	type: 'number',
	validate: function (val) {
		return Number.isSafeInteger(val) && val >= 0 && val < 2**64;
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

	router.use('/clients', route$clients());
	router.use('/codeholders', route$codeholders());
	router.use('/countries', route$countries());
	router.use('/country_groups', route$country_groups());
	router.use('/http_log', route$http_log());
	router.use('/membership_categories', route$membership_categories());
	router.use('/queries', route$queries());

	return router;
}

/**
 * Wraps an async function to ensure proper error handling in Express
 * @param {Function} fn
 * @param {Function} [onErr] An optional function to call when an error is caught
 * @return {Function}
 */
export function wrap (fn, onErr) {
	return (req, res, next) => {
		const promise = fn(req, res, next);
		if (promise.catch) {
			promise.catch(err => {
				if (typeof onErr === 'function') { onErr(err); }
				next(err);
			});
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

	let validateQuery = null;
	if (bind.schema && bind.schema.query && typeof bind.schema.query === 'object' && !Array.isArray(bind.schema.query)) {
		validateQuery = ajv.compile(bind.schema.query);
	}

	// Matches certain MySQL InnoDB boolean mode queries according to the API spec
	const querySearchWord = '[\\p{L}\\p{N}]';
	const querySearchRegex = XRegExp(
		`^
		( [+-]?
			(
				  ( "(${querySearchWord}{3,}      | ${querySearchWord}+\\*)
					 (\\s+(${querySearchWord}{3,} | ${querySearchWord}+\\*))*" )

				| ( ${querySearchWord}{3,}        | ${querySearchWord}+\\*)
			)
		)

		( \\s+ [+-]?
			(
				  ( "(${querySearchWord}{3,}      | ${querySearchWord}+\\*)
					 (\\s+(${querySearchWord}{3,} | ${querySearchWord}+\\*))*" )

				| ( ${querySearchWord}{3,}        | ${querySearchWord}+\\*)
			)
		)*
		$`,

		'x'
	);

	router[method](path, async function validate (req, res, next) {
		try {
			if (bind.schema) {
				/**
				 * query:				null for none allowed,
				 * 						String 'collection' to allow collection parameters,
				 * 						String 'resource' to allow resource parameters,
				 * 						Array for a whitelist,
				 * 						Object for JSON schema validation.
				 * [maxQueryLimit]: 	The upper bound for ?limit, defaults to 100
				 * [fields]:        	An object of fields allowed in a collection. The key is the field name and the value is a string containing flags:
				 * 						f = filterable
				 * 						s = searchable
				 * [fieldSearchGroups]:	An array of fields searchable only together, e.g.
		 		 * 						[ 'firstName,lastName' ]
		 		 * [customSearch]:      An object of colName:function for custom search mappings. The function takes one argument, `match` which is a function taking one argument, the columns to match against, which will generate the `MATCH (...) AGAINST (...)` statement. The function must return a knex raw statement
		 		 * [fieldAliases]:		An object of alias:colName used for mapping REST aliases to their actual db col name
				 * [defaultFields]: 	The default fields to be selected when query.fields is undefined
				 * [alwaysSelect]:      An array of fields that always are to be selected
				 * [alwaysWhere]:       A function with two arguments, `query` (a knex query) and `req` (the express request), which will add a where clause to the query that should always be included, even in metadata.
				 * [customCompOps]:     Custom comparison operators. See `/src/routing/codeholders/schema.js` for usage
				 * [customLogicOps]:    Custom logic operators. See `/src/routing/codeholders/schema.js` for usage
				 * body:				null for none allowed,
				 * 						Object for JSON schema validation.
				 * [multipart]:         Defaults to false. Must be an array of objects to pass to `multer#fields`. Additional options are:
				 * 						minCount, maxSize, mimeCheck (a function with one argument which must return a boolean)
				 * [requirePerms]:  	An array of strings or a string containing required permissions
				 */

				if ('requirePerms' in bind.schema) {
					if (typeof bind.schema.requirePerms === 'string') {
						bind.schema.requirePerms = [ bind.schema.requirePerms ];
					}
					for (let perm of bind.schema.requirePerms) {
						if (!req.hasPermission(perm)) {
							const err = new Error(`Missing permission ${perm}`);
							err.statusCode = 403;
							return next(err);
						}
					}
				}

				if (!!bind.schema.multipart !== !!req.is('multipart/form-data')) { return res.sendStatus(415); }
				if (bind.schema.multipart) {
					const uploadFields = bind.schema.multipart.slice(0);
					if (bind.schema.body) {
						uploadFields.unshift({
							name: 'req',
							maxCount: 1,
							minCount: 1,
							maxSize: '1mb',
							mimeCheck: mime => mime === 'application/json' || mime === 'application/vnd.msgpack'
						});
					}

					await new Promise((resolve, reject) => {
						multer({
							dest: os.tmpdir()
						}).fields(uploadFields)(req, res, function (err) {
							if (err) {
								if (err instanceof multer.MulterError) { err.statusCode = 400; }
								reject(err);
							}
							else { resolve(); }
						});
					});

					// Always clean up temp files
					res.on('finish', async () => {
						for (let fileArr of Object.values(req.files)) {
							for (let file of fileArr) {
								try {
									await fs.unlink(file.path);
								} catch (e) {
									if (e.code !== 'ENOENT') {
										throw e;
									}
								}
							}
						}
					});

					for (let fileSchema of uploadFields) {
						const fileArr = req.files[fileSchema.name] || [];

						if (fileSchema.minCount && (fileArr.length < fileSchema.minCount)) {
							return res.status(400).type('text/plain').send(`At least ${fileSchema.minCount} ${fileSchema.name} fields are expected`);
						}

						for (let file of fileArr) {
							if ('maxSize' in fileSchema) {
								let maxSize = fileSchema.maxSize;
								if (typeof maxSize === 'string') { maxSize = bytesUtil(maxSize); }
								if (file.size > maxSize) {
									return res.status(413).type('text/plain'.send(`${fileSchema.name} must not be larger than ${bytesUtil(maxSize)}`));
								}
							}

							if ('mimeCheck' in fileSchema) {
								if (!fileSchema.mimeCheck(file.mimetype)) {
									return res.status(415).type('text/plain').send(`Unexpected mime type for ${fileSchema.name}`);
								}
							}
						}
					}

					if (bind.schema.body) {
						const file = req.files.req[0];
						const fileData = await fs.readFile(file.path);
						try {
							if (file.mimetype === 'application/json') {
								req.body = JSON.parse(fileData.toString());
							} else if (file.mimetype === 'application/vnd.msgpack') {
								req.body = msgpack.decode(fileData, { codec: AKSO.msgpack });
							}
						} catch (e) {
							e.statusCode = 400;
							throw e;
						}
					}

				}

				if (!('maxQueryLimit' in bind.schema)) {
					bind.schema.maxQueryLimit = 100;
				}
				if (!('customSearch' in bind.schema)) {
					bind.schema.customSearch = {};
				}

				if ('noop' in req.query) {
					delete req.query.noop;
				}

				if ('query' in bind.schema) {
					if (!bind.schema.query) {
						if (Object.keys(req.query).length) {
							const err = new Error('Endpoint expects no query params');
							err.statusCode = 400;
							return next(err);
						}
					} else if (Array.isArray(bind.schema.query)) {
						for (let key of Object.keys(req.query)) {
							if (bind.schema.query.indexOf(key) === -1) {
								const err = new Error(`Unknown query parameter ${key}`);
								err.statusCode = 400;
								return next(err);
							}
						}

					} else if (typeof bind.schema.query === 'object') {
						if (!validateQuery(req.query)) {
							res.status(400).sendObj(validateQuery.errors);
							return;
						}

					} else if (typeof bind.schema.query === 'string') {
						const whitelist = [];

						if (bind.schema.query === 'collection') {
							whitelist.push( 'limit', 'offset', 'order', 'fields', 'search', 'filter' );
						} else if (bind.schema.query === 'resource') {
							whitelist.push( 'fields' );
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

								if (req.query.limit < 1 || req.query.limit > bind.schema.maxQueryLimit) {
									const err = new Error(`?limit must be in [1, ${bind.schema.maxQueryLimit}]`);
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
									let dotIndex = x.lastIndexOf('.');
									let dirIndex = dotIndex + 1;
									if (dotIndex === -1) {
										dotIndex = undefined;
										dirIndex = x.length;
									}
									const bits = [ x.substring(0, dotIndex), x.substring(dirIndex) || 'asc' ];
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

								if (!querySearchRegex.test(req.query.search.query) || req.query.search.query.length > 250) {
									const err = new Error('Invalid query in ?search');
									err.statusCode = 400;
									return next(err);
								}

								if (!(req.query.search.cols.join(',') in bind.schema.customSearch)) {
									for (let col of req.query.search.cols) {
										if (bind.schema.fields[col] === undefined) {
											const err = new Error(`Unknown field ${col} used in ?search`);
											err.statusCode = 400;
											return next(err);
										}
									}

									if (req.query.search.cols.length === 1) {
										if (bind.schema.fields[req.query.search.cols[0]].indexOf('s') === -1) {
											const err = new Error(`The field ${req.query.search.cols[0]} cannot be used in ?search as it's not searchable`);
											err.statusCode = 400;
											return next(err);
										}
									} else {
										if (!(bind.schema.fieldSearchGroups && bind.schema.fieldSearchGroups.indexOf(req.query.search.cols.join(',')) > -1)) {
											const err = new Error(`The fields ${req.query.search.cols.join(',')} cannot be used in ?search as they're not a searchable combination`);
											err.statusCode = 400;
											return next(err);
										}
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
						if (req.body instanceof Buffer && !req.body.length) {
							const err = new Error('Endpoint expects a body');
							err.statusCode = 400;
							return next(err);
						}
						if (!validateBody(req.body)) {
							res.status(400).sendObj(validateBody.errors);
							return;
						}
					}
				}
			}

			next();

		} catch (e) { next(e); }

	}, wrap(bind.run, bind.onError));
}

/**
 * Express middleware to ensure TOTP is used if required
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
