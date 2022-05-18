export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		// Make sure Telegraf is ready
		// This only happens if the request is performed faster than the worker is ready, which should never happen
		if (!AKSO.telegrafBotUser) {
			return res.type('text/plain').status(400)
				.send('Please try again later');
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
