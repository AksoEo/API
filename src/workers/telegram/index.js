import { Telegraf } from 'telegraf';
import { base64url } from 'rfc4648';
import path from 'path';
import fs from 'fs-extra';
import PQueue from 'p-queue';

import { createConsumer, WorkerQueues } from 'akso/queue';
import { renderTemplate } from 'akso/util';
import AKSOOrganization from 'akso/lib/enums/akso-organization';
import { formatCodeholderName } from 'akso/workers/http/lib/codeholder-util';

let telegraf;
const queue = new PQueue({
	intervalCap: 30,
	interval: 1000, // 1 second
	carryoverConcurrencyCount: true,
	concurrency: 1
});

/**
 * Sets up the Telegram bot
 */
export async function init () {
	telegraf = new Telegraf(AKSO.conf.telegram.token);
	telegraf.start(handleDeepLink);
	try {
		await telegraf.launch();
	} catch (e) {
		AKSO.log.error('An error occured when setting up Telegram:');
		console.error(e); // eslint-disable-line no-console
		AKSO.log.warn('Running without sending Telegram messages.');

		return;
	}

	process.send({
		forward: true,
		action: 'set_telegraf_userinfo',
		data: await telegraf.telegram.getMe(),
	});

	await createConsumer(WorkerQueues.SEND_TELEGRAM, sendNotification);
}

/**
 * Sends a built-in telegram notification to an array of recipients
 * @param {Object}   options
 * @param {number[]} options.codeholderIds The recipients
 * @param {string}   options.org           The org of the notification
 * @param {string}   options.tmpl          The name of the notification template
 * @param {Object}   [options.view]        The view for the template.
 * @param {Object}   [options.attach]      A Telegram attachment object
 * @return {Promise} A Promise that resolves when the notifications have been sent
 */
async function sendNotification ({
	codeholderIds,
	org,
	tmpl,
	view = {},
	attach = undefined
}) {
	const recipientData = await AKSO.db('codeholders_notifAccounts_telegram')
		.whereIn('codeholderId', codeholderIds)
		.select('codeholderId', 'telegram_chatId');

	// Obtain the template
	const notifDir = path.join(AKSO.dir, 'notifs', org, tmpl, 'telegram');
	const notifData = JSON.parse(await fs.readFile(path.join(notifDir, 'notif.json'), 'utf8'));
	const parseMode = notifData.parse_mode === 'Markdown' ? 'md' : 'html';
	const doEscape = parseMode === 'html';
	const notifTmpl = await fs.readFile(path.join(notifDir, `notif.${parseMode}`), 'utf8');

	// Render and send the messages
	view.domain = AKSOOrganization.getDomain(org);

	const queuePromises = [];
	for (let recipient of recipientData) {
		queuePromises.push(queue.add(function renderSendTelegramNotif () {
			const msg = renderTemplate(notifTmpl, view, !doEscape);

			let fn;
			let args = [recipient.telegram_chatId];
			if (attach) {
				if (attach.type === 'document') {
					fn = telegraf.telegram.sendDocument;
					args.push(attach.file, {
						...notifData,
						...{
							caption: msg
						},
						...attach.extra
					});

				} else {
					throw new Error('Unknown Telegram attachment type ' + attach.type);
				}
			} else {
				fn = telegraf.telegram.sendMessage;
				args.push(msg, notifData);
			}

			fn.apply(telegraf.telegram, args).catch(async e => {
				if (
					e.code === 400 &&
					e.response &&
					typeof e.response.description === 'string' &&
					e.response.description.includes('chat not found')
				) {
					// Change notif preferences to remove telegram
					await AKSO.db('codeholders_notif_pref')
						.where('codeholderId', recipient.codeholderId)
						.whereRaw('FIND_IN_SET("telegram", `pref`)')
						// Remove telegram from the list unless it's the only item, in which case it should be replaced by email
						.update('pref', AKSO.db.raw('IF(`pref` = "telegram", "email", `pref` & ~FIND_IN_SET("telegram", `pref`))'));

					await AKSO.db('codeholders_notif_pref_global')
						.where('codeholderId', recipient.codeholderId)
						// Remove telegram from the list unless it's the only item, in which case it should be replaced by email
						.update('pref', AKSO.db.raw('IF(`pref` = "telegram", "email", `pref` & ~FIND_IN_SET("telegram", `pref`))'));

					// Unlink the notif account since it clearly doesn't exist
					await AKSO.db('codeholders_notifAccounts_telegram')
						.where('codeholderId', recipient.codeholderId)
						.delete();

					// TODO: Perhaps some way to send the message by email instead?

				} else {
					AKSO.log.error(e.stack);
				}
			});
		}));
	}

	return await Promise.all(queuePromises);
}

const deepLinkNotFoundMsg = 'La ligilo kiun vi uzis por agordi Telegramon kun AKSO ne plu validas. Bonvolu provi denove.';
/**
 * @internal Handles deeplinking Telegram accounts
 * @param  {Telegraf.Context} ctx
 */
async function handleDeepLink (ctx) {
	const chatId = ctx.chat.id;

	let deepLink;
	try {
		deepLink = Buffer.from(base64url.parse(ctx.startPayload, { loose: true }));
	} catch (e) {
		return ctx.reply(deepLinkNotFoundMsg);
	}

	// Try to find the key
	const deepLinkData = await AKSO.db('codeholders_notifAccounts_telegram')
		.where('telegram_deepLink', deepLink)
		.first('codeholderId');

	if (!deepLinkData) { return ctx.reply(deepLinkNotFoundMsg); }

	// Ensure the chat id hasn't already been used
	const chatIdUsed = await AKSO.db('codeholders_notifAccounts_telegram')
		.where('telegram_chatId', chatId)
		.first(1);

	if (chatIdUsed) {
		return ctx.reply('Tiu ĉi Telegram-konto estas jam uzata por sciigoj de AKSO, TEJO kaj UEA. Ne necesas reagordi ĝin.');
	}

	// Update the database
	await AKSO.db('codeholders_notifAccounts_telegram')
		.where('codeholderId', deepLinkData.codeholderId)
		.update({
			telegram_chatId: chatId,
			telegram_deepLink: null,
			telegram_deepLink_time: null
		});

	const nameData = await AKSO.db('view_codeholders')
		.where('id', deepLinkData.codeholderId)
		.first([
			'codeholderType',
			'firstName',
			'firstNameLegal',
			'lastName',
			'lastNameLegal',
			'fullName',
			'honorific',
		]);
	const name = formatCodeholderName(nameData);
	ctx.reply(`Estimata ${name},\n\nVia Telegram-konto nun estas ligita al via konto ĉe AKSO kaj TEJO/UEA.`);
}
