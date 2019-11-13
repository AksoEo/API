import QueryUtil from 'akso/lib/query-util';
import HttpLogResource from 'akso/lib/resources/http-log-resource';

const schema = {
	query: 'collection',
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		time: 'f',
		codeholderId: 'f',
		apiKey: 'f',
		ip: 'f',
		origin: 'f',
		userAgent: 's',
		userAgentParsed: 's',
		method: 'f',
		path: 'f',
		query: '',
		resStatus: 'f',
		resTime: 'f',
		resLocation: ''
	},
	body: null,
	requirePerms: 'log.read'
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('httpLog');
		await QueryUtil.handleCollection({ req, res, schema, query, Res: HttpLogResource });
	}
};
