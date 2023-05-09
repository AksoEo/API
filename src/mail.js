import path from 'path';
import fs from 'fs-extra';
import { default as deepmerge } from 'deepmerge';
import tmp from 'tmp-promise';
import msgpack from 'msgpack-lite';
import moment from 'moment-timezone';

import { renderTemplate, promiseAllObject } from 'akso/util';
import { formatCodeholderName } from 'akso/workers/http/lib/codeholder-util';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

export async function getNamesAndEmails (ids, db = AKSO.db) {
	const map = {};
	ids.forEach((id, i) => {
		map[id] = i;
	});
	const codeholders = await db('view_codeholders')
		.whereIn('id', ids)
		.whereNotNull('email')
		.select('id', 'codeholderType', 'honorific', 'firstName', 'firstNameLegal', 'lastName', 'lastNameLegal', 'fullName', 'email');

	const newArr = [];
	for (let codeholder of codeholders) {
		const index = map[codeholder.id];
		const name = formatCodeholderName(codeholder);
		newArr[index] = {
			email: codeholder.email,
			name: name
		};
	}
	return newArr;
}

/**
 * Renders and schedules an email to a number of recipients
 * @param  {Object} options
 * @param  {string} options.org                The organization of the email
 * @param  {string} options.tmpl               The name of the notification template
 * @param  {Array}  [options.to]               The recipients, either as codeholder ids (number) or something understood by sendgrid
 * @param  {Array}  [options.personalizations] Sendgrid personalizations with `to` either as codeholder ids (number) or something understood by sendgrid
 * @param  {Object} [options.view]             The view
 * @param  {Object} [msgData]                  Additional options to pass to sendgrid
 * @param  {KnexTrx}[db]                       The knex transaction to use for db queries, defaults to AKSO.db
 */
export async function renderSendEmail ({
	org,
	tmpl,
	to,
	personalizations = [],
	view = {},
	msgData = {},
	db = AKSO.db,
} = {}) {
	const notifsDir = path.join(AKSO.dir, 'notifs');

	if (typeof to !== 'undefined') {
		if (!Array.isArray(to)) { to = [to]; }
		personalizations.push(...to.map(r => { return { to: r }; }));
	}

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
		const names = await getNamesAndEmails(codeholderIds.map(x => x.id), db);
		for (let i = 0; i < codeholderIds.length; i++) {
			const index = codeholderIds[i].index;
			if (!names[i]) {
				personalizations.splice(index, 1);
				continue;
			}
			personalizations[index].to = names[i];
			if (!('substitutions' in personalizations[index])) { personalizations[index].substitutions = {}; }
			personalizations[index].substitutions.name = names[i].name;
		}
	}

	if (!personalizations.length) { return; }

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

	// Render subject
	msg.subject = renderTemplate(msg.subject, view, false);

	view.subject = msg.subject;
	view.domain = AKSOOrganization.getDomain(org);
	const innerHtml = renderTemplate(templs.innerHtml, view);
	const innerText = renderTemplate(templs.innerText, view, false);

	// Render outer
	const outerView = {
		subject: msg.subject,
	};
	msg.html = renderTemplate(templs.outerHtml, {...outerView, ...{ content: innerHtml } });
	msg.text = renderTemplate(templs.outerText, {...outerView, ...{ content: innerText } }, false);

	// Split the mail into chunks of 100 recipients and schedule
	const sendPromises = [];
	for (let i = 0; i < msg.personalizations.length; i += 100) {
		const msgChunk = {
			...msg,
			...{
				personalizations: msg.personalizations.slice(i, i + 100)
			}
		};
		sendPromises.push(sendRawMail(msgChunk));
	}
	await Promise.all(sendPromises);
}

/**
 * Schedules a raw email for sending
 * @param  {Object} msg A Sendgrid mail object
 */
export async function sendRawMail (msg) {
	const scheduleDir = path.join(AKSO.conf.stateDir, 'notifs_mail');

	const tmpName = await tmp.tmpName({ tmpdir: scheduleDir, prefix: 'tmp-' });
	await fs.writeFile(tmpName, msgpack.encode(msg, { codec: AKSO.msgpack }));
	const newName = await tmp.tmpName({ tmpdir: scheduleDir, prefix: 'mail-' + moment().unix(), keep: true });
	await fs.move(tmpName, newName);
}
