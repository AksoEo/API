import path from 'path';
import fs from 'fs-extra';
import { default as deepmerge } from 'deepmerge';
import { crush } from 'html-crush';

import { renderTemplate, promiseAllObject } from 'akso/util';
import { addToQueue, WorkerQueues } from 'akso/queue';

import { formatCodeholderName } from 'akso/workers/http/lib/codeholder-util';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

export async function getNamesAndEmailsNew (ids, db = AKSO.db) {
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
			address: codeholder.email,
			name: name,
		};
	}
	return newArr;
}

/**
 * Renders and schedules a built-in notif template to be sent
 * @param  {Object} options
 * @param  {string} options.org                The organization of the email
 * @param  {string} options.tmpl               The name of the notification template
 * @param  {Array|Object|Number} [options.to]  The recipient(s), either as codeholder ids (number) or `{ name, address }`
 * @param  {Object} [options.view]             The view
 * @param  {Object} [options.nodemailer]       Additional args to pass to nodemailer
 * @param  {KnexTrx}[db]                       The knex transaction to use for db queries, defaults to AKSO.db
 */
export async function renderSendNotification ({
	org,
	tmpl,
	to,
	view = {},
	nodemailer = {},
	db = AKSO.db,
} = {}) {
	const notifsDir = path.join(AKSO.dir, 'notifs');

	if (!Array.isArray(to)) { to = [to]; }

	// Convert codeholder ids in `to` to email addresses
	const codeholderIds = [];
	for (const [i, recipient] of Object.entries(to)) {
		if (typeof recipient !== 'number') { continue; }
		codeholderIds.push({
			id: recipient,
			index: i,
		});
	}
	if (codeholderIds.length) {
		const names = await getNamesAndEmailsNew(codeholderIds.map(x => x.id), db);
		for (let i = 0; i < codeholderIds.length; i++) {
			const index = codeholderIds[i].index;
			if (!names[i]) {
				// The codeholder id does not seem to exist
				AKSO.log.warn(`Unknown codeholder id ${codeholderIds[i].id} in renderSendNotification (tmpl: ${tmpl})`);
				to.splice(index, 1);
				continue;
			}
			to[index] = names[i];
		}
	}

	if (!to.length) { return; } // there are no recipients

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

	const msg = deepmerge.all([
		JSON.parse(templs.outerMsgData),
		JSON.parse(templs.innerMsgData),
		{ to },
		nodemailer,
	], { clone: false });

	view.subject = msg.subject;
	view.domain = AKSOOrganization.getDomain(org);

	// Render and send for each recipient
	const sendPromises = [];
	for (const recipient of msg.to) {
		const recipientView = {
			...view,
			name: recipient?.name,
		};

		const msgRecipient = {
			...msg,
			...{
				to: recipient,
				subject: renderTemplate(msg.subject, recipientView, false),
			}
		};
		recipientView.subject = msgRecipient.subject;

		// Render inner
		const innerHtml = renderTemplate(templs.innerHtml, recipientView);
		const innerText = renderTemplate(templs.innerText, recipientView, false);

		// Render outer
		const outerView = {
			subject: recipientView.subject,
			name: recipientView.subject,
		};
		msgRecipient.html = renderTemplate(templs.outerHtml, {...outerView, content: innerHtml });
		msgRecipient.text = renderTemplate(templs.outerText, {...outerView, content: innerText }, false);

		
		sendPromises.push(sendRawMail(msgRecipient));
	}

	await Promise.all(sendPromises);
}

/**
 * Schedules a raw email for sending
 * @param  {Object} msg A nodemailer email object
 */
export async function sendRawMail (msg) {
	// Minify the HTML
	// html-crush is email-safe
	const msgMinified = { ...msg };
	if (msg.html) {
		msgMinified.html = crush(msg.html, {
			removeLineBreaks: true,
			lineLengthLimit: 900, // RFC 5322 § 2.1.1 says max is 998, we'll do 900 to be conservative
			removeHTMLComments: 1, // remove non-outlook comments
		}).result;
	}
	await addToQueue(WorkerQueues.SEND_EMAIL, msgMinified);
}

