import * as intentUtil from 'akso/lib/aksopay-intent-util';
import { getStripe, ensureAndValidateWebhook } from 'akso/lib/stripe';

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
		const stripeClient = await getStripe(expiredIntent.stripeSecretKey, false);
		try {
			await stripeClient.paymentIntents.cancel(expiredIntent.stripePaymentIntentId, {
				cancellation_reason: 'abandoned'
			});
		} catch (e) {
			AKSO.log.error(e);
			await ensureAndValidateWebhook(expiredIntent.stripeSecretKey);
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
