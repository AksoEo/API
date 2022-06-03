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

		if (prefStr === 'email') {
			await AKSO.db('codeholders_notif_pref_global')
				.where('codeholderId', req.user.user)
				.delete();
		} else {
			await AKSO.db('codeholders_notif_pref_global')
				.insert({
					codeholderId: req.user.user,
					pref: prefStr,
				})
				.onConflict('codeholderId')
				.merge();
		}

		res.sendStatus(204);
	}
};
