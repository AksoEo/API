import { sendTemplate } from 'akso/lib/notif-template-util';

export default {
	schema: {
		query: null,
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
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const templateOrgData = await AKSO.db('notif_templates')
			.where({
				id: req.body.notifTemplateId,
				intent: 'newsletter'
			})
			.first('org');
		if (!templateOrgData) { return res.sendStatus(404); }
		if (!req.hasPermission('notif_templates.read.' + templateOrgData.org)) { return res.sendStatus(403); }
		if (!req.hasPermission('newsletters.' + templateOrgData.org + '.send')) { return res.sendStatus(403); }

		const newsletter = await AKSO.db('newsletters')
			.where('id', req.params.newsletterId)
			.first('org');
		if (!newsletter) { return res.sendStatus(404); }
		if (newsletter.org !== templateOrgData.org) {
			return res.sendStatus(404);
		}

		if (req.body.deleteTemplateOnComplete && !req.hasPermission('notif_templates.delete.' + templateOrgData.org)) {
			return res.sendStatus(403);
		}

		// Respond so the client isn't left hanging
		res.sendStatus(202);

		await sendTemplate({
			templateId: req.body.notifTemplateId,
			req: {
				query: {
					filter: {
						$newsletterSubscriptions: {
							id: req.params.newsletterId,
						}
					},
				},
			},
		});

		// Delete the template if necessary
		if (req.body.deleteTemplateOnComplete) {
			await AKSO.db('notif_templates')
				.where('id', req.body.notifTemplateId)
				.delete();
		}
	}
};
