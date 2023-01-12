import { getStripe, processEvent } from 'akso/lib/stripe';

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

		let stripeSecretKey,
			stripePaymentIntentId,
			paymentIntent;
		switch (typeBits[0]) {
		case 'payment_intent':
		case 'charge':
			switch (typeBits[0]) {
			case 'payment_intent':
				stripePaymentIntentId = req.body.data.object.id;
				break;
			case 'charge':
				if (!req.body.data.object.payment_intent) { return; }
				stripePaymentIntentId = req.body.data.object.payment_intent;
			}

			paymentIntent = await AKSO.db('pay_intents')
				.where('stripePaymentIntentId', stripePaymentIntentId)
				.first('stripeSecretKey');
			if (!paymentIntent) { return; }
			stripeSecretKey = paymentIntent.stripeSecretKey;	
		}
		if (!stripeSecretKey) { return; }

		const webhook = await AKSO.db('pay_stripe_webhooks')
			.where('stripeSecretKey', stripeSecretKey)
			.first('secret');
		if (!webhook) { return; }

		const stripeClient = await getStripe(stripeSecretKey, false);

		const sig = req.headers['stripe-signature'];
		let event;
		try {
			event = stripeClient.webhooks.constructEvent(req.rawBody, sig, webhook.secret);
		} catch (e) {
			return;
		}

		await processEvent(stripeSecretKey, event, stripePaymentIntentId);
	}
};
