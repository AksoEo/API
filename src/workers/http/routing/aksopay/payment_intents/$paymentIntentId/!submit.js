import * as intentUtil from 'akso/lib/aksopay-intent-util';

export default {
	schema: {},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const paymentIntent = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('*');
		if (!paymentIntent) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.submit.' + paymentIntent.org)) {
			if (paymentIntent.paymentMethod.type !== 'intermediary' ||
				!req.hasPermission(`pay.payment_intents.intermediary.${paymentIntent.org}.${paymentIntent.intermediaryCountryCode}`)) {
				return res.sendStatus(403);
			}
		}

		if (!['manual', 'intermediary'].includes(paymentIntent.paymentMethod.type) || paymentIntent.status !== 'pending') {
			return res.sendStatus(409);
		}

		await intentUtil.updateStatus(paymentIntent.id, 'submitted');

		res.sendStatus(204);
	}
};
