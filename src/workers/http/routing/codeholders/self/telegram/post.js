import moment from 'moment-timezone';
import crypto from 'pn/crypto';
import { base64url } from 'rfc4648';

export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		// Make sure Telegraf is ready
		// This only happens if the telegraf worker is not (yet) ready
		if (!AKSO.telegrafBotUser) {
			return res.type('text/plain').status(403)
				.send('Telegram support is currently unavailable, please try again later.');
		}

		// Check if Telegram is already linked
		const hasTelegramLink = await AKSO.db('codeholders_notifAccounts_telegram')
			.first(1)
			.where({
				codeholderId: req.user.user
			})
			.whereNotNull('telegram_chatId');

		if (hasTelegramLink) {
			return res.sendStatus(409);
		}

		const deepLinkId = await crypto.randomBytes(16);
		const deepLinkIdBase64 = base64url.stringify(deepLinkId, { pad: false });

		await AKSO.db('codeholders_notifAccounts_telegram')
			.insert({
				telegram_deepLink: deepLinkId,
				telegram_deepLink_time: moment().unix(),
				codeholderId: req.user.user,
			})
			.onConflict('codeholderId')
			.merge();

		const url = new URL(AKSO.telegrafBotUser.username, 'https://t.me');
		url.searchParams.set('start', deepLinkIdBase64);

		res.type('text/plain').send(url);
	}
};
