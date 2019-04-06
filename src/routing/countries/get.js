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
	defaultFields: [ 'code' ],
	body: null
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('countries');
		QueryUtil.simpleCollection(req, schema, query);

		const countries = await query;
		for (let row of countries) { delete row._relevance; }
		res.sendObj(countries);
	}
};
