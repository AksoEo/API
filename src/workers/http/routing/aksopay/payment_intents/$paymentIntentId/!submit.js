export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const paymentIntent = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('*');
		if (!paymentIntent) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.update.' + paymentIntent.org)) { return res.sendStatus(403); }

		if (paymentIntent.paymentMethod.type !== 'manual' || paymentIntent.status !== 'pending') {
			return res.sendStatus(409);
		}

		await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.update('status', 'submitted');

		res.sendStatus(204);
	}
};
