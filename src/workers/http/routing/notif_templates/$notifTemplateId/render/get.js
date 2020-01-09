import AKSONotifTemplateIntent from 'akso/lib/enums/akso-notif-template-intent';
import { renderTemplate } from 'akso/lib/notif-template-util';

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const templateData = await AKSO.db('notif_templates')
			.where('id', req.params.notifTemplateId)
			.first('org', 'intent');
		if (!templateData) { return res.sendStatus(404); }
		if (!req.hasPermission('notif_templates.read.' + templateData.org)) { return res.sendStatus(403); }
		
		const renderedTemplate = await renderTemplate(req.params.notifTemplateId, AKSONotifTemplateIntent.getBogusData(templateData.intent));
		res.sendObj(renderedTemplate);
	}
};
