import QueryUtil from 'akso/lib/query-util';
import NewsletterResource from 'akso/lib/resources/newsletter-resource';

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
		const query = AKSO.db('newsletters_subscribers')
			.where('codeholderId', req.user.user)
			.innerJoin('newsletters', 'newsletters_subscribers.newsletterId', 'newsletters.id');
		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: NewsletterResource,
		});
	}
};
