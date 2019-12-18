import AKSOEmailTemplateIntent from 'akso/lib/enums/akso-email-template-intent';
import { renderTemplate } from 'akso/lib/email-template-util';

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const templateData = await AKSO.db('email_templates')
			.where('id', req.params.emailTemplateId)
			.first('org', 'intent');
		if (!templateData) { return res.sendStatus(404); }
		if (!req.hasPermission('email_templates.read.' + templateData.org)) { return res.sendStatus(403); }
		
		const renderedTemplate = await renderTemplate(req.params.emailTemplateId, AKSOEmailTemplateIntent.getBogusData(templateData.intent));
		res.sendObj(renderedTemplate);
	}
};
