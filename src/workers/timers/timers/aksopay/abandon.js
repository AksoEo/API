import * as intentUtil from 'akso/lib/aksopay-intent-util';

import Stripe from 'stripe';

export async function abandonExpiredPaymentIntents () {
	let expiredIntents = await AKSO.db('pay_intents')
		.leftJoin('pay_methods', 'paymentMethodId', 'pay_methods.id')
		.where('status', 'pending')
		.whereRaw('timeCreated < UNIX_TIMESTAMP() - pay_methods.paymentValidity')
		.orderBy('timeCreated')
		.select(
			'pay_intents.id',
			'pay_intents.stripeSecretKey',
			'pay_intents.stripePaymentIntentId',
			AKSO.db.raw('IF(pay_methods.`type` IS NULL, paymentMethod->"$.type", pay_methods.`type`) AS `type`')
		)
		.limit(50);

	for (const expiredIntent of expiredIntents) {
		if (expiredIntent.type !== 'stripe') { continue; }
		const stripeClient = new Stripe(expiredIntent.stripeSecretKey, {
			apiVersion: AKSO.STRIPE_API_VERSION
		});
		try {
			await stripeClient.paymentIntents.cancel(expiredIntent.stripePaymentIntentId, {
				cancellation_reason: 'abandoned'
			});
		} catch (e) {
			AKSO.log.error(e);
			break;
		}
	}

	// We only need to mark non-stripe intents as abandoned
	// stripe intents will do that through the webhook automatically
	const ids = expiredIntents
		.filter(x => x.type !== 'stripe')
		.map(x => x.id);
	if (!ids.length) { return; }

	await intentUtil.updateStatuses(ids, 'abandoned');
}
abandonExpiredPaymentIntents.intervalMs = 30000; // Check every 30 seconds
