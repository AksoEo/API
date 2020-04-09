import Stripe from 'stripe';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: AKSO.STRIPE_WEBHOOK_EVENTS
				},
				api_version: {
					type: 'string',
					const: AKSO.STRIPE_API_VERSION
				}
			},
			required: [
				'type',
				'api_version'
			]
		}
	},

	run: async function run (req, res) {
		res.sendStatus(204);

		const typeBits = req.body.type.split('.');

		let stripeClient,
			stripeSecretKey,
			paymentIntentId,
			paymentIntent;
		switch (typeBits[0]) {
		case 'payment_intent':
		case 'charge':
			switch (typeBits[0]) {
			case 'payment_intent':
				paymentIntentId = req.body.data.object.id;
				break;
			case 'charge':
				if (!req.body.data.object.payment_intent) { return; }
				paymentIntentId = req.body.data.object.payment_intent;
			}

			paymentIntent = await AKSO.db('pay_intents')
				.where('stripePaymentIntentId', paymentIntentId)
				.first('stripeSecretKey', 'amountRefunded');
			if (!paymentIntent) { return; }
			stripeSecretKey = paymentIntent.stripeSecretKey;

			stripeClient = new Stripe(stripeSecretKey, {
				apiVersion: AKSO.STRIPE_API_VERSION
			});		
		}
		if (!stripeClient) { return; }

		const webhook = await AKSO.db('pay_stripe_webhooks')
			.where('stripeSecretKey', stripeSecretKey)
			.first('secret');
		if (!webhook) { return; }

		const sig = req.headers['stripe-signature'];
		let event;
		try {
			event = stripeClient.webhooks.constructEvent(req.rawBody, sig, webhook.secret);
		} catch (e) {
			return;
		}
		

		switch (req.body.type) {
		case 'payment_intent.canceled': {
			const newStatus = event.data.object.cancellation_reason === 'abandoned' ?
				'abandoned' : 'canceled';

			await AKSO.db('pay_intents')
				.where('stripePaymentIntentId', paymentIntentId)
				.update('status', newStatus);
			break;
		}
		case 'payment_intent.processing':
			await AKSO.db('pay_intents')
				.where('stripePaymentIntentId', paymentIntentId)
				.update('status', 'processing');
			break;

		case 'payment_intent.succeeded':
			await AKSO.db('pay_intents')
				.where('stripePaymentIntentId', paymentIntentId)
				.update('status', 'succeeded');
			break;

		case 'charge.refunded':
			let allCharges;
			try {
				allCharges = await stripeClient.charges.list({
					limit: 100,
					payment_intent: paymentIntentId
				});
			} catch (e) {
				AKSO.log.error('Error occured while processing Stripe charge.refunded for ' + paymentIntentId);
				AKSO.log.error(e);
				return;
			}
			const totalRefund = allCharges.data.reduce((a, b) => a.amount_refunded + b.amount_refunded);

			await AKSO.db('pay_intents')
				.where('stripePaymentIntentId', paymentIntentId)
				.update({
					status: 'refunded',
					amountRefunded: totalRefund
				});
			break;

		case 'charge.dispute.created':
			await AKSO.db('pay_intents')
				.where('stripePaymentIntentId', paymentIntentId)
				.update('status', 'disputed');
			break;

		case 'charge.dispute.closed':
			// Check if anything has been refunded
			const newStatus = paymentIntent.amountRefunded > 0 ? 'refunded' : 'succeeded';
			await AKSO.db('pay_intents')
				.where('stripePaymentIntentId', paymentIntentId)
				.update('status', newStatus);
		}
	}
};
