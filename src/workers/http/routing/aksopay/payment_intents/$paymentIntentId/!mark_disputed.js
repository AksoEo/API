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
			'submitted', 'succeeded'
		].includes(paymentIntent.status) ||
			paymentIntent.paymentMethod.type !== 'manual') {
			
			return res.sendStatus(409);
		}

		await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.update('status', 'disputed');

		res.sendStatus(204);
	}
};
