import moment from 'moment-timezone';

export default {
	schema: {
		body: null,
		query: {
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
			},
			required: [ 'token', 'ctx' ],
			additionalProperties: false,
		},
	},

	run: async function run (req, res) {
		const token = Buffer.from(req.query.token, 'hex');
		const ctx = req.query.ctx.toUpperCase();

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
		}

		await trx('tokens')
			.where('token', token)
			.delete();

		await trx.commit();
	},
};
