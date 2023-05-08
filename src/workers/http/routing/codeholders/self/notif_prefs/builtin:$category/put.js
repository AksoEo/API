export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				pref: {
					type: 'array',
					uniqueItems: true,
					minItems: 1,
					items: {
						type: 'string',
						enum: [
							'email',
							'telegram'
						],
					}
				}
			},
			required: [ 'pref' ],
			additionalProperties: false,
		},
	},

	run: async function run (req, res) {
		// Make sure the category is real and exists
		const permittedCategories = [
			'admin',
			'vote',
			'account',
		];
		if (!permittedCategories.includes(req.params.category)) {
			return res.status(400).type('text/plain')
				.send('Invalid category');
		}

		if (req.body.pref.includes('telegram')) {
			// Make sure Telegram is linked
			const telegramLinked = await AKSO.db('codeholders_notifAccounts_telegram')
				.first(1)
				.where('codeholderId', req.user.user)
				.whereNotNull('telegram_chatId');
			if (!telegramLinked) {
				return res.status(400).type('text/plain')
					.send('telegram must be linked to use it as a notif pref');
			}
		}

		const prefStr = req.body.pref.join(',');

		await AKSO.db('codeholders_notif_pref')
			.insert({
				codeholderId: req.user.user,
				category: req.params.category,
				pref: prefStr,
			})
			.onConflict([ 'codeholderId', 'category' ])
			.merge();

		res.sendStatus(204);
	}
};
