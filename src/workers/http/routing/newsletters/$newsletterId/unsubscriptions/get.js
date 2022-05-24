import QueryUtil from 'akso/lib/query-util';

import { schema as parSchema } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const newsletter = await AKSO.db('newsletters')
			.first('org')
			.where('id', req.params.newsletterId);
		if (!newsletter) { return res.sendStatus(404); }
		
		const orgPerm = 'newsletters.' + newsletter.org + '.read';
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }
		
		const query = AKSO.db('newsletters_unsubscriptions')
			.where('newsletterId', req.params.newsletterId);
		await QueryUtil.handleCollection({
			req, res, schema, query,
		});
	}
};
