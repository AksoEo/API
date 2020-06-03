import Stripe from 'stripe';
import moment from 'moment-timezone';
import * as intentUtil from 'akso/lib/aksopay-intent-util';

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

		const time = req.body.created || moment().unix();

		let stripeClient,
			stripeSecretKey,
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
				.first('stripeSecretKey', 'amountRefunded', 'id');
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

			await intentUtil.updateStatus(paymentIntent.id, newStatus, time);
			break;
		}
		case 'payment_intent.processing':
			await intentUtil.updateStatus(paymentIntent.id, 'processing', time);
			break;

		case 'payment_intent.succeeded':
			await intentUtil.updateStatus(paymentIntent.id, 'succeeded', time);
			break;

		case 'charge.refunded':
			let allCharges;
			try {
				allCharges = await stripeClient.charges.list({
					limit: 100,
					payment_intent: stripePaymentIntentId
				});
			} catch (e) {
				AKSO.log.error('Error occured while processing Stripe charge.refunded for ' + stripePaymentIntentId);
				AKSO.log.error(e);
				return;
			}
			const totalRefund = allCharges.data.reduce((a, b) => a.amount_refunded + b.amount_refunded);

			await intentUtil.updateStatus(paymentIntent.id, 'refunded', time, { amountRefunded: totalRefund });
			break;

		case 'charge.dispute.created':
			await intentUtil.updateStatus(paymentIntent.id, 'disputed', time);
			break;

		case 'charge.dispute.closed':
			// Check if anything has been refunded
			const newStatus = paymentIntent.amountRefunded > 0 ? 'refunded' : 'succeeded';
			await intentUtil.updateStatus(paymentIntent.id, newStatus, time);
		}
	}
};
