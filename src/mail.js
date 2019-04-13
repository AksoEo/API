import sendgrid from '@sendgrid/mail';
import path from 'path';
import fs from 'pn/fs';
import { default as deepmerge } from 'deepmerge';

import * as CodeholderUtils from './lib/codeholder-utils';
import { promiseAllObject, renderTemplate } from './util';
import AKSOOrganization from './lib/enums/akso-organization';

let notifsDir;

export async function init () {
	AKSO.log.info('Establishing connection to Sendgrid mail server ...');

	AKSO.mail = new sendgrid.MailService();
	AKSO.mail.setApiKey(AKSO.conf.sendgrid.apiKey);

	notifsDir = path.join(AKSO.dir, 'notifs');

	AKSO.log.info('... Sendgrid mail client ready');
}

/**
 * Renders and sends an email to a number of recipients
 * @param  {Object} options
 * @param  {string} options.org                The organization of the email
 * @param  {string} options.tmpl               The name of the notification template
 * @param  {Array}  [options.to]               The recipients, either as codeholder ids (number) or something understood by sendgrid
 * @param  {Array}  [options.personalizations] Sendgrid personalizations with to either as codeholder ids (number) or something understood by sendgrid
 * @param  {Object} [options.view]             The view
 * @param  {Object} [msgData]                  Additional options to pass to sendgrid
 */
export async function renderSendEmail ({
	org,
	tmpl,
	to,
	personalizations = [],
	view = {},
	msgData = {}
} = {}) {
	if (to !== undefined) {
		if (!Array.isArray(to)) { to = [to]; }
		personalizations.push(...to.map(r => { return { to: r }; }));
	}

	if (personalizations !== undefined) {
		// Convert codeholder ids in `to` to email addresses
		const codeholderIds = [];
		for (let i = 0; i < personalizations.length; i++) {
			const recipient = personalizations[i].to;
			if (typeof recipient !== 'number') { continue; }
			codeholderIds.push({
				id: recipient,
				index: i
			});
		}
		if (codeholderIds.length) {
			const names = await CodeholderUtils.getNamesAndEmails(codeholderIds.map(x => x.id));
			for (let i = 0; i < codeholderIds.length; i++) {
				const index = codeholderIds[i].index;
				personalizations[index].to = names[i];
				if (!('substitutions' in personalizations[index])) { personalizations[index].substitutions = {}; }
				personalizations[index].substitutions.name = names[i].name;
			}
		}
	}

	const orgDir = path.join(notifsDir, org);
	const globalDir = path.join(orgDir, '_global', 'email');
	const tmplDir = path.join(orgDir, tmpl, 'email');

	const templs = await promiseAllObject({
		outerHtml: fs.readFile(path.join(globalDir, 'notif.html'), 'utf8'),
		outerText: fs.readFile(path.join(globalDir, 'notif.txt'), 'utf8'),
		outerMsgData: fs.readFile(path.join(globalDir, 'notif.json'), 'utf8'),

		innerHtml: fs.readFile(path.join(tmplDir, 'notif.html'), 'utf8'),
		innerText: fs.readFile(path.join(tmplDir, 'notif.txt'), 'utf8'),
		innerMsgData: fs.readFile(path.join(tmplDir, 'notif.json'), 'utf8')
	});

	// Render inner
	const msg = deepmerge.all([
		JSON.parse(templs.outerMsgData),
		JSON.parse(templs.innerMsgData),
		{
			personalizations: personalizations
		},
		msgData
	]);
	view.subject = msg.subject;
	view.domain = AKSOOrganization.getDomain(org);
	const innerHtml = renderTemplate(templs.innerHtml, view);
	const innerText = renderTemplate(templs.innerText, view, false);

	// Render outer
	const outerView = {
		subject: msg.subject,
		unsubscribe: false // TODO: unsubscribe link
	};
	msg.html = renderTemplate(templs.outerHtml, {...outerView, ...{ content: innerHtml } });
	msg.text = renderTemplate(templs.outerText, {...outerView, ...{ content: innerText } }, false);

	return await AKSO.mail.send(msg);
}
