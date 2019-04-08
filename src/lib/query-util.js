import SimpleCollection from './simple-collection';
import SimpleResource from './resources/simple-resource';

/**
 * Asserts the input to be a scalar (string, number, boolean, null)
 * @param  {string,number,boolean,null} val
 * @throws {Error} If the input isn't scalar
 */
function filterAssertScalar (val) {
	if (typeof val !== 'string' && typeof val !== 'number' && typeof val !== 'boolean' && val !== null) {
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
	$and: function filterLogicOpAnd (fields, query, filterArr) {
		filterAssertArray(filterArr);
		filterArr.forEach(filterAssertObject);

		query.where(function () {
			for (let obj of filterArr) {
				QueryUtil.filter(fields, this, obj);
			}
		});
	},
	$or: function filterLogicOpOr (fields, query, filterArr) {
		filterAssertArray(filterArr);
		filterArr.forEach(filterAssertObject);

		query.where(function () {
			for (let obj of filterArr) {
				this.orWhere(function () {
					QueryUtil.filter(fields, this, obj);
				});
			}
		});
	},
	$not: function filterLogicOpNot (fields, query, filterObj) {
		filterAssertObject(filterObj);

		query.whereNot(function () {
			QueryUtil.filter(fields, this, filterObj);
		});
	}
};

const filterCompOps = {
	$eq: function filterCompOpEq (field, query, val) {
		filterAssertScalar(val);

		query.where(field, val);
	},
	$neq: function filterCompOpNeq (field, query, val) {
		filterAssertScalar(val);

		query.whereNot(field, val);
	},
	$gt: function filterCompOpGt (field, query, val) {
		filterAssertNumber(val);

		query.where(field, '>', val);
	},
	$gte: function filterCompOpGte (field, query, val) {
		filterAssertNumber(val);

		query.where(field, '>=', val);
	},
	$lt: function filterCompOpLt (field, query, val) {
		filterAssertNumber(val);

		query.where(field, '<', val);
	},
	$lte: function filterCompOpLte (field, query, val) {
		filterAssertNumber(val);

		query.where(field, '<=', val);
	},
	$in: function filterCompOpIn (field, query, val) {
		filterAssertArray(val);
		val.forEach(filterAssertScalar);

		query.whereIn(field, val);
	},
	$nin: function filterCompOpNin (field, query, val) {
		filterAssertArray(val);
		val.forEach(filterAssertScalar);

		query.whereNotIn(field, val);
	},
	$hasany: function filterCompOnHasany (field, query, val) { // eslint-disable-line no-unused-vars
		const err = new Error('$hasany has not yet been implemented');
		err.statusCode = 400;
		throw err;
		// TODO
	},
	$hasnone: function filterCompOnHasnone (field, query, val) { // eslint-disable-line no-unused-vars
		const err = new Error('$hasnone has not yet been implemented');
		err.statusCode = 400;
		throw err;
		// TODO
	},
	$hasall: function filterCompOnHasall (field, query, val) { // eslint-disable-line no-unused-vars
		const err = new Error('$hasall has not yet been implemented');
		err.statusCode = 400;
		throw err;
		// TODO
	}
};

const QueryUtil = {
	/**
	 * Handles the ?filter parameter
	 * @param {string[]}          fields    The permitted filterable fields
	 * @param {knex.QueryBuilder} query     The query builder to apply the where statement to
	 * @param {Object}            filterObj The filter object as supplied by `req.query.filter`
	 */
	filter: function queryUtilFilter (fields, query, filterObj) {
		query.where(function () {
			for (let key in filterObj) { // Iterate through each key
				if (fields.indexOf(key) > -1) { // key is a field
					let val = filterObj[key];
					if (val === null || (typeof val !== 'object' && !(val instanceof Array))) { // normal equality
						val = { $eq: val }; // turn into an $eq comparison operator
					}

					// Handle comparison operator
					this.where(function () {
						for (let compOp in val) {
							if (!(compOp in filterCompOps)) {
								const err = new Error(`Unknown comparison operator ${compOp} used in ?filter`);
								err.statusCode = 400;
								throw err;
							}

							filterCompOps[compOp](key, this, val[compOp]);
						}
					});

				} else if (key in filterLogicOps) {
					filterLogicOps[key](fields, this, filterObj[key]);
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

		query.first(fields);
	},

	/**
	 * Handles a simple collection
	 * @param  {express.Request}   req
	 * @param  {Object}            schema The endpoint's schema
	 * @param  {knex.QueryBuilder} query  The query to build upon
	 * @return {Object} An object containing metadata on the collection:
	 *     {knex.QueryBuilder} `totalItems`        The total amount of items in the collection without `?limit` and `?offset`
	 *     {knex.QueryBuilder} `totalItemNoFilter` The total amount of items in the collection without `?limit`, `?offset`, `?search` and `?filter`
	 */
	simpleCollection: function queryUtilSimpleCollection (req, schema, query) {
		// ?fields, ?search
		let fields = req.query.fields || schema.defaultFields;

		if (req.query.search) {
			fields.push(AKSO.db.raw(
				`MATCH (${'??,'.repeat(req.query.search.cols.length).slice(0,-1)})
				AGAINST (? IN BOOLEAN MODE) as ??`,

				[ ...req.query.search.cols, req.query.search.query, '_relevance' ]
			));
			query.whereRaw(
				`MATCH (${'??,'.repeat(req.query.search.cols.length).slice(0,-1)})
				AGAINST (? IN BOOLEAN MODE)`,

				[ ...req.query.search.cols, req.query.search.query ]
			);
		}

		query.select(fields);

		// ?filter
		if (req.query.filter) {
			QueryUtil.filter(
				Object.keys(schema.fields).filter(x => schema.fields[x].indexOf('f' > -1)),
				query,
				req.query.filter
			);
		}

		// ?order
		if (req.query.order) {
			query.orderBy(req.query.order);
		}

		// ?limit
		query.limit(req.query.limit || schema.maxQueryLimit);

		// ?offset
		if (req.query.offset) {
			query.offset(req.query.offset);
		}

		const metadata = {};
		const metaQuery = query.clone();

		metaQuery
			.clearSelect()
			.first(AKSO.db.raw('count(1) as `count`'))

			.limit(Number.MAX_SAFE_INTEGER)
			.offset(0);

		metadata.totalItems = metaQuery.clone();

		metaQuery.clearWhere();
		metadata.totalItemNoFilter = metaQuery.clone();

		return metadata;
	},

	/**
	 * Sets collection metadata headers 
	 * @param {express.Response} res      
	 * @param {Object}           metadata Metadata obtained from #simpleCollection
	 */
	async collectionMetadata (res, metadata) {
		res.set('X-Total-Items', (await metadata.totalItems).count);
		res.set('X-Total-Item-No-Filter', (await metadata.totalItemNoFilter).count);
	},

	/**
	 * Handles an entire basic collection
	 * @param {express.Request}   req
	 * @param {express.Response}  res
	 * @param {Object}            schema The schema as used in bindMethod
	 * @param {knex.QueryBuilder} query  The query to build upon
	 * @param {Object}            [Res]  The resource type to use
	 * @param {Object}            [Col]  The collection type to use
	 */
	async handleCollection (req, res, schema, query, Res = SimpleResource, Col = SimpleCollection) {
		await QueryUtil.collectionMetadata(res, 
			QueryUtil.simpleCollection(req, schema, query)
		);
		const data = new Col(await query, Res);
		res.sendObj(data);
	}
};

export default QueryUtil;
