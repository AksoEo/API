import { ensureAndValidateWebhook } from 'akso/lib/stripe';

export async function ensureWebhooks () {
	const uniqueSecretKeys = await AKSO.db('pay_methods')
		.select('stripeSecretKey')
		.distinct('stripeSecretKey')
		.pluck('stripeSecretKey')
		.where('type', 'stripe');
	for (const secretKey of uniqueSecretKeys) {
		await ensureAndValidateWebhook(secretKey);
	}
}
ensureWebhooks.intervalMs = 7200000; // Check every 2 hours
