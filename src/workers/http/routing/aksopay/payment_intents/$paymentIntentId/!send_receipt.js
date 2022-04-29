import * as intentUtil from 'akso/lib/aksopay-intent-util';

export default {
	schema: {
		body: {
			type: 'object',
			properties: {
				email: {
					type: 'string',
					format: 'email',
					minLength: 3,
					maxLength: 200,
				},
			},
			additionalProperties: false,
		}
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const paymentIntent = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('id', 'org', 'status', 'customer_email');
		if (!paymentIntent) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.read.' + paymentIntent.org)) {
			return res.sendStatus(403);
		}

		if (paymentIntent.status !== 'succeeded') { return res.sendStatus(409); }
		if (!paymentIntent.customer_email && !req.body.email) {
			return res.type('text/plain').status(400)
				.send('An email must be passed when the customer field is null');
		}

		await intentUtil.sendReceiptEmail(paymentIntent.id, req.body.email);

		res.sendStatus(204);
	}
};
