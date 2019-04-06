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

function filterAssertNumber (val) {
	if (typeof val !== 'number' || !Number.isFinite(val)) {
		const err = new Error('Invalid number in ?filter');
		err.statusCode = 400;
		throw err;
	}
}

function filterAssertArray (val) {
	if (!(val instanceof Array)) {
		const err = new Error('Expected array in ?filter');
		err.statusCode = 400;
		throw err;
	}
}

function filterAssertObject (val) {
	if (typeof val !== 'object' || val === null || val instanceof Array) {
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

	simpleResource: function queryUtilSimpleResource (req, schema, query) {
		// ?fields
		const fields = req.query.fields || schema.defaultFields;

		query.first(fields);
	},

	simpleCollection: function queryUtilSimpleCollection (req, schema, query) {
		// ?fields, ?search
		let fields = req.query.fields || schema.defaultFields;

		if (req.query.search) {
			fields.push(query.raw(
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
	}
};

export default QueryUtil;
