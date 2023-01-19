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

		const removedTelegramLink = await AKSO.db('codeholders_notifAccounts_telegram')
			.where({
				codeholderId: req.user.user
			})
			.whereNotNull('telegram_chatId')
			.delete();

		res.sendStatus(removedTelegramLink ? 204 : 404);
	}
};
