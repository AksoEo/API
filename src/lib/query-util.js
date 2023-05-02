import { escapeId } from 'mysql2';
import Url from 'url';
import moment from 'moment-timezone';

import SimpleCollection from './simple-collection';
import SimpleResource from './resources/simple-resource';

/**
 * Asserts the input to be a scalar (Buffer, string, number, boolean, null)
 * @param  {Buffer, string,number,boolean,null} val
 * @throws {Error} If the input isn't scalar
 */
function filterAssertScalar (val) {
	if (!(val instanceof Buffer) && typeof val !== 'string' && typeof val !== 'number' && typeof val !== 'boolean' && val !== null) {
		const err = new Error('Invalid field comparison value used in ?filter');
		err.statusCode = 400;
		throw err;
	}
	if (typeof val === 'number' && !Number.isFinite(val)) {
		const err = new Error('Non-finite field value used in ?filter');
		err.statusCode = 400;
		throw err;
	}
}

/**
 * Asserts the input to be a number
 * @param  {number} val
 * @throws {Error} If the input isn't a number
 */
function filterAssertNumber (val) {
	if (typeof val !== 'number' || !Number.isFinite(val)) {
		const err = new Error('Invalid number in ?filter');
		err.statusCode = 400;
		throw err;
	}
}

function filterAssertNumberOrDate (val) {
	if (typeof val === 'number') {
		if (!Number.isFinite(val)) {
			const err = new Error('Invalid number in ?filter');
			err.statusCode = 400;
			throw err;
		}
	} else if (typeof val === 'string') {
		if (!moment(val, 'YYYY-MM-DD').isValid()) {
			const err = new Error('Invalid date in ?filter');
			err.statusCode = 400;
			throw err;
		}
	} else {
		const err = new Error('Expected number or date string in ?filter');
		err.statusCode = 400;
		throw err;
	}
}

/**
 * Asserts the input to be a string
 * @param  {string} val
 * @throws {Error} If the input isn't a string
 */
function filterAssertString (val) {
	if (typeof val !== 'string') {
		const err = new Error('Invalid string in ?filter');
		err.statusCode = 400;
		throw err;
	}
}

/**
 * Asserts the input to be an array
 * @param  {Array} val
 * @throws {Error} If the input isn't an array
 */
function filterAssertArray (val) {
	if (!Array.isArray(val)) {
		const err = new Error('Expected array in ?filter');
		err.statusCode = 400;
		throw err;
	}
}

/**
 * Asserts the input to be a basic object (not an array or null)
 * @param  {Object} val
 * @throws {Error} If the input isn't an object
 */
function filterAssertObject (val) {
	if (typeof val !== 'object' || val === null || Array.isArray(val)) {
		const err = new Error('Expected object in ?filter');
		err.statusCode = 400;
		throw err;
	}
}

const filterLogicOps = {
	$and: function filterLogicOpAnd ({
		fields, query, filter, fieldAliases, fieldWhitelist, customCompOps, customLogicOpsFields, customLogicOps
	} = {}) {
		filterAssertArray(filter);
		filter.forEach(filterAssertObject);

		query.where(function () {
			for (let obj of filter) {
				if (!Object.keys(obj).length) { this.where(AKSO.db.raw('1')); }
				else {
					QueryUtil.filter({
						fields,
						query: this,
						filter: obj,
						fieldAliases,
						fieldWhitelist,
						customCompOps,
						customLogicOpsFields,
						customLogicOps
					});
				}
			}
		});
	},
	$or: function filterLogicOpOr ({
		fields, query, filter, fieldAliases, fieldWhitelist, customCompOps, customLogicOpsFields, customLogicOps
	} = {}) {
		filterAssertArray(filter);
		filter.forEach(filterAssertObject);

		query.where(function () {
			for (let obj of filter) {
				if (!Object.keys(obj).length) { this.orWhere(AKSO.db.raw('1')); }
				else {
					this.orWhere(function () {
						QueryUtil.filter({
							fields,
							query: this,
							filter: obj,
							fieldAliases,
							fieldWhitelist,
							customCompOps,
							customLogicOpsFields,
							customLogicOps
						});
					});
				}
			}
		});
	},
	$not: function filterLogicOpNot ({
		fields, query, filter, fieldAliases, fieldWhitelist, customCompOps, customLogicOpsFields, customLogicOps
	} = {}) {
		filterAssertObject(filter);

		query.whereNot(function () {
			QueryUtil.filter({
				fields,
				query: this,
				filter,
				fieldAliases,
				fieldWhitelist,
				customCompOps,
				customLogicOpsFields,
				customLogicOps
			});
		});
	}
};

const filterCompOps = {
	$eq: function filterCompOpEq (field, query, val) {
		filterAssertScalar(val);

		if (typeof val === 'string' && val.startsWith('==base64==')) {
			let binary;
			try {
				binary = Buffer.from(val.substring(10), 'base64');
			} catch {
				// noop
			}
			if (binary) {
				query.orWhere(field, val);
				query.orWhere(field, binary);
				return;
			}
		}

		query.where(field, val);
	},
	$neq: function filterCompOpNeq (field, query, val) {
		filterAssertScalar(val);

		if (typeof val === 'string' && val.startsWith('==base64==')) {
			val = val.substring(10);
			try {
				val = Buffer.from(val, 'base64');
			} catch {
				const err = new Error('Invalid base64 string in ?filter');
				err.statusCode = 400;
				throw err;
			}
		}

		query.whereNot(field, val);
	},
	$pre: function filterCompOpPre (field, query, val) {
		filterAssertString(val);

		val = val
			.replace(/%/g, '\\%')
			.replace(/_/g, '\\_') + '%';
		query.where(field, 'LIKE', val);
	},
	$range: function filterCompOpRange (field, query, val) {
		filterAssertArray(val);
		if (val.length !== 2) {
			const err = new Error('Expected exactly two items for $range in ?filter');
			err.statusCode = 400;
			throw err;
		}
		val.forEach(filterAssertScalar);

		query.whereBetween(field, val);
	},
	$gt: function filterCompOpGt (field, query, val) {
		filterAssertNumberOrDate(val);

		query.where(field, '>', val);
	},
	$gte: function filterCompOpGte (field, query, val) {
		filterAssertNumberOrDate(val);

		query.where(field, '>=', val);
	},
	$lt: function filterCompOpLt (field, query, val) {
		filterAssertNumberOrDate(val);

		query.where(field, '<', val);
	},
	$lte: function filterCompOpLte (field, query, val) {
		filterAssertNumberOrDate(val);

		query.where(field, '<=', val);
	},
	$in: function filterCompOpIn (field, query, val) {
		filterAssertArray(val);
		val.forEach(filterAssertScalar);
		val = val.map(x => {
			if (typeof x === 'string' && x.startsWith('==base64==')) {
				x = x.substring(10);
				try {
					x = Buffer.from(x, 'base64');
				} catch {
					const err = new Error('Invalid base64 string in ?filter');
					err.statusCode = 400;
					throw err;
				}
			}
			return x;
		});

		query.whereIn(field, val);
	},
	$nin: function filterCompOpNin (field, query, val) {
		filterAssertArray(val);
		val.forEach(filterAssertScalar);

		

		query.whereNotIn(field, val);
	}
};

const QueryUtil = {
	getAlias: function getAlias (fieldAliases, field, includeAs = true, db = AKSO.db) {
		if (!fieldAliases) { return field; }
		const alias = fieldAliases[field];
		if (!alias) { return field; }
		if (typeof alias === 'function') {
			let newField = alias();
			if (includeAs) { newField = db.raw(`(${newField}) AS ${escapeId(field, true)}`); }
			return newField;
		}
		return alias;
	},

	/**
	 * Handles the ?filter parameter
	 * @param {Object}            fields           The fields with their flags
	 * @param {knex.QueryBuilder} query            The query builder to apply the where statement to
	 * @param {Object}            filter           The filter object as supplied by `req.query.filter`
	 * @param {Object}            [fieldAliases]   The field aliases as defined in the schema
	 * @param {Array}             [fieldWhitelist] The filterable fields used for per client whitelisting
	 * @param {Object}            [customCompOps]  Custom comparison operators. See `/src/workers/http/routing/codeholders/schema.js` for usage
	 * @param {Object}            [customLogicOps] Custom logic operators. See `/src/workers/http/routing/codeholders/schema.js` for usage
	 */
	filter: function queryUtilFilter ({
		fields,
		query,
		filter,
		fieldAliases = {},
		fieldWhitelist,
		customCompOps = {},
		customLogicOps = {},
		customLogicOpsFields = {}
	} = {}) {
		query.where(function () {
			for (let key in filter) { // Iterate through each key
				if (key in fields) { // key is a field
					let val = filter[key];
					if (val === null || val instanceof Buffer || (typeof val !== 'object' && !(val instanceof Array))) { // normal equality
						val = { $eq: val }; // turn into an $eq comparison operator
					}

					// Ensure the field is filterable
					if (!fields[key].includes('f')) {
						// Error unless only permitted custom comp ops are used
						for (const compOp in val) {
							if (compOp in customCompOps && key in customCompOps[compOp]) {
								continue;
							}
							const err = new Error(`Non-filterable field ${key} used in ?filter`);
							err.statusCode = 400;
							throw err;
						}
					}

					// Ensure the client has the necessary permissions
					if (fieldWhitelist && !fieldWhitelist.includes(key)) {
						const err = new Error(`Disallowed field ${key} used in ?filter`);
						err.statusCode = 403;
						throw err;
					}

					// Handle comparison operators
					this.where(function () {
						for (const compOp in val) {
							// Check if the field is an alias
							const orgKey = key;
							key = QueryUtil.getAlias(fieldAliases, key, false);

							if (compOp in filterCompOps) {
								filterCompOps[compOp](key, this, val[compOp]);
							} else if (compOp in customCompOps && orgKey in customCompOps[compOp]) {
								val = val[compOp];
								if (compOp === '$hasAny') {
									if (!Array.isArray(val)) { val = [ val ]; }
									val.forEach(x => filterAssertScalar(x));
								}
								customCompOps[compOp][orgKey](this, val);
							} else {
								const err = new Error(`Unknown comparison operator ${compOp} used in ?filter`);
								err.statusCode = 400;
								throw err;
							}
						}
					});

				} else if (key in filterLogicOps || key in customLogicOps) {
					// Check if the field is an alias
					key = QueryUtil.getAlias(fieldAliases, key);

					let filterFn;
					if (key in filterLogicOps) { filterFn = filterLogicOps[key]; }
					else { filterFn = customLogicOps[key]; }

					// Make sure the user has access to the logic op
					if (fieldWhitelist) {
						let logicOpFields = customLogicOpsFields[key];
						if (!logicOpFields) { logicOpFields = []; }
						else if (!Array.isArray(logicOpFields)) { logicOpFields = [logicOpFields]; }

						for (const field of logicOpFields) {
							if (!fieldWhitelist.includes(field)) {
								const err = new Error(`Disallowed logic op ${key} used in ?filter`);
								err.statusCode = 403;
								throw err;
							}
						}
					}

					filterFn({
						fields,
						query: this,
						filter: filter[key],
						fieldAliases,
						fieldWhitelist,
						customCompOps,
						customLogicOps
					});
				} else {
					const err = new Error(`Unknown field or logical operator ${key} used in ?filter`);
					err.statusCode = 400;
					throw err;
				}
			}
		});
	},

	/**
	 * Handles a simple resource
	 * @param {express.Request}   req
	 * @param {Object}            schema The endpoint's schema
	 * @param {knex.QueryBuilder} query  The query to build upon
	 */
	simpleResource: function queryUtilSimpleResource (req, schema, query) {
		// ?fields
		const fields = req.query.fields || schema.defaultFields;

		// Get the actual db col names
		const selectFields = [...new Set(fields
			.concat(schema.alwaysSelect || []))]
			.map(f => QueryUtil.getAlias(schema.fieldAliases, f));

		query.first(selectFields);
	},

	/**
	 * Handles a simple collection
	 * @param  {express.Request}   req
	 * @param  {Object}            schema           The endpoint's schema
	 * @param  {knex.QueryBuilder} query            The query to build upon
	 * @param  {Array}             [fieldWhitelist] The permitted fields for per client whitelisting
	 * @param  {knex}              [db]             The db to operate on, defaults to AKSO.db
	 * @return {Object} An object containing metadata on the collection:
	 *     {knex.QueryBuilder} `totalItems`        The total amount of items in the collection without `?limit` and `?offset`
	 *     {knex.QueryBuilder} `totalItemNoFilter` The total amount of items in the collection without `?limit`, `?offset`, `?search` and `?filter`
	 */
	simpleCollection: function queryUtilSimpleCollection (req, schema, query, fieldWhitelist, db = AKSO.db) {
		// ?fields, ?search
		const fields = req.query.fields || schema.defaultFields;
		// Get the actual db col names
		const selectFields = [...new Set(fields
			.concat(schema.alwaysSelect || []))]
			.map(f => QueryUtil.getAlias(schema.fieldAliases, f, true, db));

		if (req.query.search) {
			if (fieldWhitelist && !req.query.search.cols.every(f => fieldWhitelist.includes(f))) {
				const err = new Error('Disallowed field used in ?search');
				err.statusCode = 403;
				throw err;
			}

			const allCols = req.query.search.cols.join(',');
			if (schema.customSearch && allCols in schema.customSearch) {
				const customSearchFn = schema.customSearch[allCols];
				const matchFn = cols => {
					const colsArr = Array.isArray(cols) ? cols : [cols];
					return db.raw(
						`MATCH (${'??,'.repeat(colsArr.length).slice(0,-1)})
						AGAINST (? IN BOOLEAN MODE)`,

						[ ...colsArr, req.query.search.query ]
					);
				};
				const searchStmt = customSearchFn(matchFn);
				selectFields.push(db.raw(searchStmt + ' AS `_relevance`'));
				query.whereRaw(searchStmt);

			} else {
				const searchCols = req.query.search.cols.map(f => QueryUtil.getAlias(schema.fieldAliases, f, false, db));
				selectFields.push(db.raw(
					`MATCH (${'??,'.repeat(searchCols.length).slice(0,-1)})
					AGAINST (? IN BOOLEAN MODE) as ??`,

					[ ...searchCols, req.query.search.query, '_relevance' ]
				));
				query.whereRaw(
					`MATCH (${'??,'.repeat(searchCols.length).slice(0,-1)})
					AGAINST (? IN BOOLEAN MODE)`,

					[ ...searchCols, req.query.search.query ]
				);
			}
			let hasGroupBy = false;
			for (const statement of query._statements) {
				if (!('grouping' in statement)) { continue; }
				if (statement.grouping !== 'group') { continue; }
				hasGroupBy = true;
				break;
			}
			if (hasGroupBy) {
				// The group by will break if _relevance is missing in cases where
				// the MATCH is made on a joined table
				query.groupBy('_relevance');
			}
		}

		query.select(selectFields);

		if (schema.alwaysWhere) { schema.alwaysWhere(query, req); }

		// ?filter
		if (req.query.filter) {
			QueryUtil.filter({
				fields: schema.fields,
				query,
				filter: req.query.filter,
				fieldAliases: schema.fieldAliases || {},
				fieldWhitelist,
				customCompOps: schema.customFilterCompOps,
				customLogicOpsFields: schema.customFilterLogicOpsFields,
				customLogicOps: schema.customFilterLogicOps
			});
		}

		// ?order
		if (req.query.order) {
			if (fieldWhitelist && !req.query.order.map(x => x.column).every(f => fieldWhitelist.includes(f))) {
				const err = new Error('Disallowed field used in ?order');
				err.statusCode = 403;
				throw err;
			}
			const order = req.query.order.map(x => {
				return {
					column: QueryUtil.getAlias(schema.fieldAliases, x.column, false),
					order: x.order
				};
			});
			query.orderBy(order);
		}

		// ?limit
		const limit = req.query.limit || schema.maxQueryLimit;
		if (typeof limit !== 'undefined') { query.limit(req.query.limit || schema.maxQueryLimit); }

		// ?offset
		if (req.query.offset) {
			query.offset(req.query.offset);
		}

		const metadata = {};
		const metaSubQuery = query.clone()
			.clear('select')
			.select(1)
			.clear('order')
			.clear('limit')
			.clear('offset');

		// If we added a GROUP by _relevance earlier, we need to remove it now
		for (const [i, statement] of metaSubQuery._statements.entries()) {
			if (!('grouping' in statement)) { continue; }
			if (statement.grouping !== 'group') { continue; }
			if (statement.type !== 'groupByBasic') { continue; }
			if (!statement.value.includes('_relevance')) { continue; }
			metaSubQuery._statements.splice(i, 1);
			break;
		}

		metadata.totalItems = db.raw(`
			SELECT COUNT(1) AS \`count\`
			FROM (${metaSubQuery.toString()}) _count_table
		`);

		metaSubQuery.clearWhere();
		if (schema.alwaysWhere) { schema.alwaysWhere(metaSubQuery, req); }
		metadata.totalItemNoFilter = db.raw(`
			SELECT COUNT(1) AS \`count\`
			FROM (${metaSubQuery.toString()}) _count_table
		`);

		return metadata;
	},

	/**
	 * Sets collection metadata headers 
	 * @param {express.Response} res      
	 * @param {Object}           metadata Metadata obtained from #simpleCollection
	 */
	async collectionMetadata (res, metadata) {
		res.set('X-Total-Items', (await metadata.totalItems)[0][0].count);
		res.set('X-Total-Items-No-Filter', (await metadata.totalItemNoFilter)[0][0].count);
	},

	/**
	 * Handles an entire basic collection
	 * @param {express.Request}   req
	 * @param {express.Response}  res
	 * @param {Object}            schema           The schema as used in bindMethod
	 * @param {knex.QueryBuilder} query            The query to build upon
	 * @param {Object}            [Res]            The resource type to use
	 * @param {Object}            [Col]            The collection type to use
	 * @param {Object}            [passToCol]      Variables to pass to the collection's constructor
	 * @param {Array}             [fieldWhitelist] The permitted fields for per client whitelisting
	 * @param {Function}          [afterQuery]     A function to run after the query has been performed, before it's passed to the collection. Receives two arguments, the returned array and a callback to run when all modifications are done.
	 * @param {knex}              [db]             The db to operate on, defaults to AKSO.db
	 * @param {boolean}           [doMetaData]     Whether to add meta data information to the response. Defaults to true.
	 */
	async handleCollection ({
		req,
		res,
		schema,
		query,
		Res = SimpleResource,
		Col = SimpleCollection,
		passToCol = [],
		fieldWhitelist,
		afterQuery,
		db = AKSO.db,
		doMetaData = true
	} = {}) {
		const simpleCollectionRes = QueryUtil.simpleCollection(req, schema, query, fieldWhitelist, db);

		if (doMetaData) {
			await QueryUtil.collectionMetadata(res, simpleCollectionRes);
		}
		const rawData = await query;
		try {
			if (afterQuery) {
				await new Promise((resolve, reject) => {
					// Awaits if it's async, otherwise goes ahead immediately
					return Promise.resolve(afterQuery(rawData, resolve, req))
						.catch(e => {
							reject(e);
						});
				});
			}
		} catch (e) {
			const url = Url.parse(req.originalUrl).pathname;
			AKSO.log.error(`An error occured in the afterQuery at ${req.method} ${url}\n${e.stack}`);
			return res.sendStatus(500);
		}
		const data = new Col(rawData, Res, ...passToCol);
		res.sendObj(data);
	}
};

export default QueryUtil;
