import * as intentUtil from 'akso/lib/aksopay-intent-util';

import Stripe from 'stripe';

const webhookURL = new URL(AKSO.STRIPE_WEBHOOK_URL, AKSO.conf.http.outsideAddress).toString();

export async function getStripe (stripeSecretKey, doCheck = true) {
	// Verify Stripe keys
	const stripe = new Stripe(stripeSecretKey, {
		apiVersion: AKSO.STRIPE_API_VERSION
	});
	if (doCheck) {
		try {
			await stripe.paymentIntents.list({ limit: 1 }); // random request to verify key
		} catch (e) {
			if (e.type === 'StripeAuthenticationError') {
				const err = new Error('Invalid stripe secret key');
				err.statusCode = 409;
				throw err;
			}
			e.statusCode = 500;
			throw e;
		}
	}
	return stripe;
}

export async function checkWebhook (stripeSecretKey) {
	const webhook = await AKSO.db('pay_stripe_webhooks')
		.first('enabledEvents', 'apiVersion', 'url', 'stripeId', 'stripeSecretKey')
		.where('stripeSecretKey', stripeSecretKey);
	if (!webhook) { return null; }

	const webhookEvents = webhook.enabledEvents.split(',');
	const sameEvents = webhookEvents.every(x => AKSO.STRIPE_WEBHOOK_EVENTS.includes(x))
		&& AKSO.STRIPE_WEBHOOK_EVENTS.every(x => webhookEvents.includes(x));
	if (sameEvents ||
		webhook.apiVersion !== AKSO.STRIPE_API_VERSION ||
		webhook.url !== webhookURL) {
		return { webhook, valid: false };
	}

	return { webhook, valid: true };
}

// Returns whether the webhook was recreated
export async function ensureWebhook (stripeSecretKey) {
	const webhookInfo = await checkWebhook(stripeSecretKey);
	const stripe = await getStripe(stripeSecretKey, false);

	if (webhookInfo?.valid) {
		// It is valid in db, but does it exist in Stripe?
		try {
			await stripe.webhookEndpoints.retrieve(webhookInfo.webhook.stripeId);
			return true;
		} catch (e) {
			if (e.statusCode === 404) { // TODO: test this
				await _createWebhook(stripeSecretKey);
				return false;
			}
			e.statusCode = 500;
			throw e;
		}
	}

	if (webhookInfo && !webhookInfo.valid) { // Exists in db but is not valid
		try {
			await stripe.webhookEndpoints.del(webhookInfo.webhook.stripeId);
			// Existed, now deleted
			await _createWebhook(stripeSecretKey);
			return false;
		} catch (e) {
			if (e.statusCode === 404) { // TODO: test this
				await _createWebhook(stripeSecretKey);
				return false;
			}
			e.statusCode = 500;
			throw e;
		}
	}

	if (!webhookInfo) {
		await _createWebhook(stripeSecretKey);
		return false;
	}
}

export async function ensureAndValidateWebhook (stripeSecretKey) {
	const existed = await ensureWebhook(stripeSecretKey);
	if (existed) { return; }
	const stripe = await getStripe(stripeSecretKey, false);
	if (!existed) {
		// Process events
		let events, starting_after;
		do {
			events = await stripe.events.list({
				types: AKSO.STRIPE_WEBHOOK_EVENTS,
				starting_after,
			});
			for (const event of events.data) {
				if (!event.data.object) {
					// Stripe is down, like what happened on 2023-05-13
					// https://twitter.com/stripestatus/status/1657146532704178177
					AKSO.log.warn('Stripe is emitting invalid event data!');
					break;
				}

				const typeBits = event.type.split('.');
				let stripePaymentIntentId;
				switch (typeBits[0]) {
				case 'payment_intent':
					stripePaymentIntentId = event.data.object.id;
					break;
				case 'charge':
					if (!event.data.object.payment_intent) { return; }
					stripePaymentIntentId = event.data.object.payment_intent;
					break;
				}

				await processEvent(stripeSecretKey, event, stripePaymentIntentId);	
			}

			if (!events.has_more || !events.data.length) { break; }
			starting_after = events.data[events.data.length - 1].id;
		} while (events);
	}
}

export async function processEvent (stripeSecretKey, event, stripePaymentIntentId) {
	const stripeClient = await getStripe(stripeSecretKey, false);

	const paymentIntent = await AKSO.db('pay_intents')
		.where('stripePaymentIntentId', stripePaymentIntentId)
		.first('stripeSecretKey', 'amountRefunded', 'id');
	if (!paymentIntent) { return; }

	const existingEvents = await AKSO.db('pay_intents_events')
		.select('status')
		.where({
			paymentIntentId: paymentIntent.id,
			time: event.created,
		})
		.pluck('status');

	switch (event.type) {
	case 'payment_intent.canceled': {
		const newStatus = event.data.object.cancellation_reason === 'abandoned' ?
			'abandoned' : 'canceled';

		if (existingEvents.includes(newStatus)) { break; }
		await intentUtil.updateStatus(paymentIntent.id, newStatus, event.created);
		break;
	}
	case 'payment_intent.processing':
		if (existingEvents.includes('processing')) { break; }
		await intentUtil.updateStatus(paymentIntent.id, 'processing', event.created);
		break;

	case 'payment_intent.succeeded':
		if (existingEvents.includes('succeeded')) { break; }
		await intentUtil.updateStatus(paymentIntent.id, 'succeeded', event.created);
		break;

	case 'charge.refunded':
		let allCharges;
		try {
			allCharges = await stripeClient.charges.list({
				limit: 100,
				payment_intent: stripePaymentIntentId,
			});
		} catch (e) {
			AKSO.log.error('Error occured while processing Stripe charge.refunded for ' + stripePaymentIntentId);
			AKSO.log.error(e);
			return;
		}
		const totalRefund = allCharges.data
			.map(x => x.amount_refunded)
			.reduce((a, b) => a + b);
		const updateData = { amountRefunded: totalRefund };

		if (existingEvents.includes('refunded')) {
			await AKSO.db('pay_intents')
				.where('id', paymentIntent.id)
				.update(updateData);
		} else {
			await intentUtil.updateStatus(paymentIntent.id, 'refunded', event.created, updateData);
		}
		break;

	case 'charge.dispute.created':
		if (existingEvents.includes('disputed')) { break; }
		await intentUtil.updateStatus(paymentIntent.id, 'disputed', event.created);
		break;

	case 'charge.dispute.closed':
		// Check if anything has been refunded
		const newStatus = paymentIntent.amountRefunded > 0 ? 'refunded' : 'succeeded';
		if (existingEvents.includes(newStatus)) { break; }
		await intentUtil.updateStatus(paymentIntent.id, newStatus, event.created);
	}
}

export async function _createWebhook (stripeSecretKey) {
	const stripe = await getStripe(stripeSecretKey, false);

	// Register the webhook
	let webhookSecret, webhookId;
	try {
		const webhook = await stripe.webhookEndpoints.create({
			api_version: AKSO.STRIPE_API_VERSION,
			enabled_events: AKSO.STRIPE_WEBHOOK_EVENTS,
			url: webhookURL,
		});
		webhookSecret = webhook.secret;
		webhookId = webhook.id;
	} catch (e) {
		e.statusCode = 500;
		throw e;
	}

	await AKSO.db('pay_stripe_webhooks')
		.insert({
			stripeSecretKey: stripeSecretKey,
			stripeId: webhookId,
			secret: webhookSecret,
			apiVersion: AKSO.STRIPE_API_VERSION,
			enabledEvents: AKSO.STRIPE_WEBHOOK_EVENTS.join(','),
			url: webhookURL,
		})
		.onConflict().merge('stripeSecretKey');
}