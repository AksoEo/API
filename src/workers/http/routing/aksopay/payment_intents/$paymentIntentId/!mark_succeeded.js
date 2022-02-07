import * as intentUtil from 'akso/lib/aksopay-intent-util';

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const paymentIntent = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('*');
		if (!paymentIntent) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.mark_succeeded.' + paymentIntent.org)) { return res.sendStatus(403); }

		if (!['manual', 'intermediary'].includes(paymentIntent.paymentMethod.type) || paymentIntent.status !== 'submitted') {
			return res.sendStatus(409);
		}

		await intentUtil.updateStatus(paymentIntent.id, 'succeeded');

		res.sendStatus(204);
	}
};
