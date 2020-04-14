import Stripe from 'stripe';

export async function abandonExpiredPaymentIntents () {
	let expiredIntents = [];
	do {
		expiredIntents = await AKSO.db('pay_intents')
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
			.limit(10);

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

		const ids = expiredIntents
			.filter(x => x.type !== 'stripe')
			.map(x => x.id);
		if (!ids.length) { return; }

		await AKSO.db('pay_intents')
			.whereIn('id', ids)
			.update('status', 'abandoned');
	} while (expiredIntents.length);
}
abandonExpiredPaymentIntents.intervalMs = 3000;