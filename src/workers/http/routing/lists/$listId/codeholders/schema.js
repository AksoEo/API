import { schema as parSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import QueryUtil from 'akso/lib/query-util';

export async function getCodeholderQuery (listId, req) {
	const list = await AKSO.db('lists')
		.where('id', listId)
		.first('filters', 'memberFilter');

	if (!list) {
		const e = new Error();
		e.statusCode = 404;
		throw e;
	}

	const parsedFilters = list.filters.map(JSON.parse);
	let unionArr;
	try {
		unionArr = parsedFilters.map(filter => {
			const reqData = {
				memberFilter: list.memberFilter,
				query: {
					filter: filter,
					fields: [ 'id' ]
				}
			};

			const subQuery = AKSO.db('view_codeholders');
			memberFilter(parSchema, subQuery, reqData);
			QueryUtil.simpleCollection(reqData, parSchema, subQuery);
			subQuery.toSQL();
			delete subQuery._single.limit;
			return subQuery;
		});
	} catch (e) {
		e.statusCode = 500;
		throw e;
	}

	const query = unionArr.splice(0, 1)[0];
	if (unionArr.length) { query.union(unionArr); }
	query.clearSelect();
	const reqQuery = {
		offset: req.query.offset,
		fields: req.query.fields
	};
	if ('limit' in req.query) { reqQuery.limit = req.query.limit; }
	QueryUtil.simpleCollection({
		query: reqQuery
	}, parSchema, query);


	return { query: query };
}
