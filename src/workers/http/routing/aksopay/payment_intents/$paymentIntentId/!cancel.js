import Stripe from 'stripe';

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const paymentIntent = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('*');
		if (!paymentIntent) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.update.' + paymentIntent.org)) { return res.sendStatus(403); }

		if (![
			'pending', 'submitted', 'disputed'
		].includes(paymentIntent.status)) { return res.sendStatus(409); }
		if (paymentIntent.status === 'disputed' && paymentIntent.paymentMethod.type !== 'manual') {
			return res.sendStatus(409);
		}


		let stripeClient = null;
		if (paymentIntent.paymentMethod.type === 'stripe') {
			try {
				stripeClient = new Stripe(paymentIntent.stripeSecretKey, {
					apiVersion: AKSO.STRIPE_API_VERSION
				});

				await stripeClient.paymentIntents.cancel(paymentIntent.stripePaymentIntentId);
			} catch (e) {
				if (e.statusCode === 402) {
					return res.sendStatus(409);
				}
				e.statusCode = 500;
				throw e;
			}
		}

		await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.update({
				status: 'canceled',
				stripeSecretKey: null
			});

		res.sendStatus(204);
	}
};
