import Telegraf from 'telegraf/telegraf';
import { base64url } from 'rfc4648';
import PQueue from 'p-queue';
import fs from 'pn/fs';
import path from 'path';

import { renderTemplate } from './util';
import AKSOOrganization from './lib/enums/akso-organization';

/**
 * Sets up the Telegram bot
 */
export async function init () {
	AKSO.log.info('Setting up Telegram bot ...');

	AKSO.telegramQueue = new PQueue({
		intervalCap: 30,
		interval: 1000, // 1 second
		carryoverConcurrencyCount: true
	});

	AKSO.telegram = new Telegraf(AKSO.conf.telegram.token);
	AKSO.telegram.start(handleDeepLink);
	await AKSO.telegram.launch();

	AKSO.log.info('... Telegram bot ready');
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
	const deepLinkData = await AKSO.db('codeholders_notif_accounts')
		.where('telegram_deepLink', deepLink)
		.first('codeholderId');

	if (!deepLinkData) { return ctx.reply(deepLinkNotFoundMsg); }

	// Ensure the chat id hasn't already been used
	const chatIdUsed = await AKSO.db('codeholders_notif_accounts')
		.where('telegram_chatId', chatId)
		.first(1);

	if (chatIdUsed) {
		return ctx.reply('Tiu ĉi Telegram-konto estas jam uzata por sciigoj de AKSO, TEJO kaj UEA. Ne necesas reagordi ĝin.');
	}

	// Update the database
	await AKSO.db('codeholders_notif_accounts')
		.where('codeholderId', deepLinkData.codeholderId)
		.update({
			telegram_chatId: chatId,
			telegram_deepLink: null,
			telegram_deepLink_time: null
		});

	ctx.reply('Via Telegram-konto nun estas ligita al via konto ĉe AKSO.');
}

/**
 * Sends a notification to an array of recipients
 * @param  {Object}   options
 * @param  {number[]} options.codeholderIds The recipients
 * @param  {string}   options.org           The org of the notification
 * @param  {string}   options.tmpl          The name of the notification template
 * @param  {Object}   [options.view]        The view for the template
 */
export async function sendNotification ({
	codeholderIds,
	org,
	tmpl,
	view = {}
}) {
	const recipientData = await AKSO.db('codeholders_notif_accounts')
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
	AKSO.telegramQueue.addAll(recipientData.map(recipient => {
		return function renderSendTelegramNotif () {
			const msg = renderTemplate(notifTmpl, view, doEscape);
			AKSO.telegram.telegram.sendMessage(recipient.telegram_chatId, msg, notifData)
				.catch(async e => {
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

						// Unlink the notif account since it clearly doesn't exist
						await AKSO.db('codeholders_notif_accounts')
							.where('codeholderId', recipient.codeholderId)
							.delete();

						// TODO: Perhaps some way to send the message by email instead?

					} else {
						AKSO.log.error(e.stack);
					}
				});
		};
	}));
}
