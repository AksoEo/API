import Telegraf from 'telegraf/telegraf';
import { base64url } from 'rfc4648';
import moment from 'moment';

export async function init () {
	AKSO.log.info('Setting up Telegram bot ...');

	AKSO.telegram = new Telegraf(AKSO.conf.telegram.token);
	AKSO.telegram.start(handleDeepLink);
	await AKSO.telegram.launch();

	AKSO.log.info('... Telegram bot ready');
}

const deepLinkNotFoundMsg = 'La ligilo kiun vi uzis por agordi Telegramon kun TEJO/UEA ne plu validas. Bonvolu provi denove.';
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
		return ctx.reply('Tiu ĉi Telegram-konto estas jam uzata por sciigoj de TEJO/UEA. Ne necesas reagordi ĝin.');
	}

	// Update the database
	await AKSO.db('codeholders_notif_accounts')
		.where('codeholderId', deepLinkData.codeholderId)
		.update({
			telegram_chatId: chatId,
			telegram_deepLink: null,
			telegram_deepLink_time: moment().unix()
		});

	ctx.reply('Via Telegram-konto nun estas ligita al via konto ĉe TEJO/UEA.');
}
