import QueryUtil from 'akso/lib/query-util';
import NewsletterResource from 'akso/lib/resources/newsletter-resource';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

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
		const newsletterOrgs = AKSOOrganization.allLower
			.filter(org => req.hasPermission('newsletters.' + org + '.read'));
		if (!newsletterOrgs.length) {
			res.type('text/plain').status(400)
				.send('Missing perm newsletters.<org>.read');
		}

		const query = AKSO.db('newsletters')
			.whereIn('org', newsletterOrgs);
		await QueryUtil.handleCollection({
			req, res, schema, query,
			Res: NewsletterResource,
		});
	}
};
