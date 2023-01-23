import * as intentUtil from 'akso/lib/aksopay-intent-util';
import { schema } from '../schema';

import moment from 'moment-timezone';

export default {
	schema: {
		body: {
			type: 'object',
			properties: {
				totalRefund: {
					type: 'integer',
					format: 'uint32',
					minimum: 1
				}
			},
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const paymentIntent = await AKSO.db('pay_intents')
			.where('id', req.params.paymentIntentId)
			.first('*', { totalAmount: schema.fieldAliases.totalAmount() });
		if (!paymentIntent) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_intents.mark_refunded.' + paymentIntent.org)) { return res.sendStatus(403); }

		if (![
			'pending', 'submitted', 'canceled', 'succeeded', 'refunded', 'disputed'
		].includes(paymentIntent.status) ||
			paymentIntent.paymentMethod.type !== 'manual') {
			
			return res.sendStatus(409);
		}



		const totalRefund = req.body.totalRefund || paymentIntent.totalAmount;
		if (totalRefund > paymentIntent.totalAmount) {
			return res.type('text/plain').status(400).send('totalRefund must not exceed PaymentIntent#totalAmount');
		}

		if (paymentIntent.succeededTime === null) {
			// If we are refunding an intent that never was marked as succeeded, we first need to set it to succeeded
			await intentUtil.updateStatus(paymentIntent.id, 'succeeded', undefined, undefined, false);
		}
		await intentUtil.updateStatus(paymentIntent.id, 'refunded', moment().unix(), { amountRefunded: totalRefund });

		res.sendStatus(204);
	}
};
