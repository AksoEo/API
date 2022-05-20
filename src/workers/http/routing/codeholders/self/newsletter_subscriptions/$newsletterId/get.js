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
		const query = AKSO.db('newsletters_subscribers')
			.where({
				codeholderId: req.user.user,
				id: req.params.newsletterId,
			})
			.innerJoin('newsletters', 'newsletters_subscribers.newsletterId', 'newsletters.id');
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new NewsletterResource(row, req, parSchema);
		res.sendObj(obj);
	}
};
