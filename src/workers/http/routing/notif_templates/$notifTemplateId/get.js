import QueryUtil from 'akso/lib/query-util';
import NotifTemplateResource from 'akso/lib/resources/notif-template-resource';

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
		const orgData = await AKSO.db('notif_templates')
			.where('id', req.params.notifTemplateId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('notif_templates.read.' + orgData.org)) { return res.sendStatus(403); }

		const query = AKSO.db('notif_templates')
			.where('id', req.params.notifTemplateId);
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		const obj = new NotifTemplateResource(row, req, schema);
		res.sendObj(obj);
	}
};
