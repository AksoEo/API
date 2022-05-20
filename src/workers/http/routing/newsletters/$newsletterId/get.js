import QueryUtil from 'akso/lib/query-util';
import NewsletterResource from 'akso/lib/resources/newsletter-resource';

import { schema as parSchema } from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
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
		
		const query = AKSO.db('newsletters')
			.where('id', req.params.newsletterId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new NewsletterResource(row, req, parSchema);
		res.sendObj(obj);
	}
};
