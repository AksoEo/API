import QueryUtil from 'akso/lib/query-util';
import { sendTemplate } from 'akso/lib/notif-template-util';

import { schema as parSchema, memberFilter } from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: {
			type: 'object',
			properties: {
				notifTemplateId: {
					type: 'integer',
					format: 'uint32'
				},
				deleteTemplateOnComplete: {
					type: 'boolean',
					default: false
				}
			},
			required: [ 'notifTemplateId' ],
			additionalProperties: false
		},
		requirePerms: [
			'codeholders.read',
			'codeholders.send_notif'
		]
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		if ('limit' in req.query) {
			return res.status(400).type('text/plain').send('?limit is not allowed');
		}
		if ('offset' in req.query) {
			return res.status(400).type('text/plain').send('?offset is not allowed');
		}
		if ('fields' in req.query) {
			return res.status(400).type('text/plain').send('?fields is not allowed');
		}

		// Make sure the user has the necessary perms
		const templateOrgData = await AKSO.db('notif_templates')
			.where({
				id: req.body.notifTemplateId,
				intent: 'codeholder'
			})
			.first('org');
		if (!templateOrgData) { return res.sendStatus(404); }
		if (!req.hasPermission('notif_templates.read.' + templateOrgData.org)) { return res.sendStatus(403); }

		if (req.body.deleteTemplateOnComplete &&!req.hasPermission('notif_templates.delete.' + templateOrgData.org)) {
			return res.sendStatus(403);
		}

		let fieldWhitelist = null;
		if (req.memberFields) { fieldWhitelist = Object.keys(req.memberFields); }

		// Make sure the memberFilter passes before sending
		const memberFilterQuery = AKSO.db('view_codeholders');
		memberFilter(schema, memberFilterQuery, req);
		QueryUtil.simpleCollection(req, schema, memberFilterQuery, fieldWhitelist);
		memberFilterQuery.toSQL();

		// Respond so the client isn't left hanging
		res.sendStatus(202);

		await sendTemplate({
			templateId: req.body.notifTemplateId,
			req, fieldWhitelist,
		});

		// Delete the template if necessary
		if (req.body.deleteTemplateOnComplete) {
			await AKSO.db('notif_templates')
				.where('id', req.body.notifTemplateId)
				.delete();
		}
	}
};
