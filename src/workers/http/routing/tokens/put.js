import moment from 'moment-timezone';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				token: {
					type: 'string',
					minLength: 64,
					maxLength: 64,
				},
				ctx: {
					type: 'string',
					minLength: 1,
					maxLength: 24,
				},
				unsubscribeReason: {
					type: 'integer',
					format: 'uint8',
					maximum: 4,
				},
			},
			required: [ 'token', 'ctx' ],
			additionalProperties: false,
		},
	},

	run: async function run (req, res) {
		const token = Buffer.from(req.body.token, 'hex');
		const ctx = req.body.ctx.toUpperCase();

		if ('unsubscribeReason' in req.body && ctx !== 'UNSUBSCRIBE_NEWSLETTER') {
			return res.type('text/plain').status(400)
				.send('unsubscribeReason may only be used when ctx is UNSUBSCRIBE_NEWSLETTER');
		}

		const tokenData = await AKSO.db('tokens')
			.first('payload')
			.where({
				token, ctx,
			});
		if (!tokenData) {
			return res.sendStatus(404);
		}

		res.sendStatus(202);

		const trx = await req.createTransaction();

		const payload = tokenData.payload;
		switch (ctx) {
		case 'DELETE_EMAIL_ADDRESS': {
			// Find the codeholder
			const codeholder = await AKSO.db('codeholders')
				.first('id')
				.where('email', payload.email);
			if (!codeholder) { break; }

			// Set email to null
			await trx('codeholders')
				.where('id', codeholder.id)
				.update('email', null);

			// Update datum history
			await trx('codeholders_hist_email')
				.insert({
					codeholderId: codeholder.id,
					modTime: moment().unix(),
					modBy: 'ch:' + codeholder.id,
					modCmt: 'Farita per retpoŝta ligilo',
					email: payload.email,
				});

			break;
		}
		case 'UNSUBSCRIBE_NEWSLETTER': {
			// Unsubscribe
			const unsubscribed = await AKSO.db('newsletters_subscribers')
				.where({
					codeholderId: payload.codeholderId,
					newsletterId: payload.newsletterId,
				})
				.delete();

			if (!unsubscribed) { break; }

			const subscriberCount = (await AKSO.db('newsletters_subscribers')
				.count({ count: 1 })
				.where('newsletterId', payload.newsletterId))[0].count;

			await AKSO.db('newsletters_unsubscriptions')
				.insert({
					newsletterId: payload.newsletterId,
					reason: req.body.unsubscribeReason ?? 0, // defaults to other
					time: moment().unix(),
					subscriberCount,
				});

			break;
		}
		}

		await trx('tokens')
			.where('token', token)
			.delete();

		await trx.commit();
	},
};
