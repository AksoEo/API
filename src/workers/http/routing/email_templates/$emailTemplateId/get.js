import QueryUtil from 'akso/lib/query-util';
import EmailTemplateResource from 'akso/lib/resources/email-template-resource';

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
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('email_templates')
			.where('id', req.params.emailTemplateId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('email_templates.read.' + orgData.org)) { return res.sendStatus(403); }

		const query = AKSO.db('email_templates')
			.where('id', req.params.emailTemplateId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		const obj = new EmailTemplateResource(row, req, schema);
		res.sendObj(obj);
	}
};
