import * as intentUtil from 'akso/lib/aksopay-intent-util';
import { getStripe } from 'akso/lib/stripe';

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const paymentIntent = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('*');
		if (!paymentIntent) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.cancel.' + paymentIntent.org)) {
			if (paymentIntent.paymentMethod.type !== 'intermediary' ||
				!req.hasPermission(`pay.payment_intents.intermediary.${paymentIntent.org}.${paymentIntent.intermediaryCountryCode}`)) {
				return res.sendStatus(403);
			}
		}

		if (![
			'pending', 'submitted', 'disputed'
		].includes(paymentIntent.status)) { return res.sendStatus(409); }
		if (paymentIntent.status === 'disputed' && paymentIntent.paymentMethod.type !== 'manual') {
			return res.sendStatus(409);
		}


		let stripeClient = null;
		if (paymentIntent.paymentMethod.type === 'stripe') {
			try {
				stripeClient = await getStripe(paymentIntent.stripeSecretKey, false);

				await stripeClient.paymentIntents.cancel(paymentIntent.stripePaymentIntentId);
			} catch (e) {
				if (e.statusCode === 402) {
					return res.sendStatus(409);
				}
				e.statusCode = 500;
				throw e;
			}
		}

		await intentUtil.updateStatus(paymentIntent.id, 'canceled');

		res.sendStatus(204);
	}
};
