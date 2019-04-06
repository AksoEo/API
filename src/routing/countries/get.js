import QueryUtil from '../../lib/query-util';

const schema = {
	query: 'collection',
	maxQueryLimit: 300,
	fields: {
		'code': 'f',
		'currency': 'f',
		'name_eo': 's',
		'name_en': '',
		'name_fr': '',
		'name_es': '',
		'name_nl': '',
		'name_pt': '',
		'name_sk': '',
		'name_zh': '',
		'name_de': ''
	},
	body: null
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const fields = req.query.fields || [ 'code' ];
		if (req.query.search) {
			fields.push(AKSO.db.raw(
				`MATCH (${'??,'.repeat(req.query.search.cols.length).slice(0,-1)})
				AGAINST (? IN BOOLEAN MODE) as ??`,

				[ ...req.query.search.cols, req.query.search.query, '_relevance' ]
			));
		}

		const query = AKSO.db('countries').select(fields);

		if (req.query.search) {
			query.whereRaw(
				`MATCH (${'??,'.repeat(req.query.search.cols.length).slice(0,-1)})
				AGAINST (? IN BOOLEAN MODE)`,

				[ ...req.query.search.cols, req.query.search.query ]
			);
		}

		if (req.query.filter) {
			QueryUtil.filter(
				Object.keys(schema.fields).filter(x => schema.fields[x].indexOf('f' > -1)),
				query,
				req.query.filter
			);
		}

		if (req.query.order) {
			query.orderBy(req.query.order);
		}

		if (req.query.limit) {
			query.limit(req.query.limit);
		}

		if (req.query.offset) {
			query.offset(req.query.offset);
		}

		const countries = await query;
		for (let row of countries) { delete row._relevance; }
		res.sendObj(countries);
	}
};
