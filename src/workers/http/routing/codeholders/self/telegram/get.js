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

		// Check if Telegram is linked
		const hasTelegramLink = await AKSO.db('codeholders_notifAccounts_telegram')
			.first(1)
			.where({
				codeholderId: req.user.user
			})
			.whereNotNull('telegram_chatId');

		res.sendStatus(hasTelegramLink ? 204 : 404);
	}
};
