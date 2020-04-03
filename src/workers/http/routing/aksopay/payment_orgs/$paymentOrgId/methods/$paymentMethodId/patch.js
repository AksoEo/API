import AKSOCurrency from 'akso/lib/enums/akso-currency';

import Stripe from 'stripe';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 64,
					pattern: '^[^\\n]+$'
				},
				internalDescription: {
					type: 'string',
					minLength: 1,
					maxLength: 1000,
					nullable: true
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				},
				currencies: {
					type: 'array',
					items: {
						type: 'string',
						enum: AKSOCurrency.all
					}
				},
				paymentValidity: {
					type: 'integer',
					format: 'uint32',
					nullable: true
				},
				isRecommended: {
					type: 'boolean'
				},
				stripeMethods: {
					type: 'array',
					uniqueItems: true,
					minItems: 1,
					items: {
						type: 'string',
						enum: [ 'card' ]
					}
				},
				stripeSecretKey: {
					type: 'string',
					maxLength: 256
				},
				stripePublishableKey: {
					type: 'string',
					maxLength: 256
				}
			},
			minProperties: 1,
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the payment org exists and is accessible
		const paymentOrg = await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.first('org');
		if (!paymentOrg) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_methods.update.' + paymentOrg.org)) {
			return res.sendStatus(403);
		}
		// Make sure the payment method exists
		const paymentMethod = await AKSO.db('pay_methods')
			.where({
				id: req.params.paymentMethodId,
				paymentOrgId: req.params.paymentOrgId
			})
			.first('type');
		if (!paymentMethod) { return res.sendStatus(404); }

		const data = { ...req.body };
		if ('stripeMethods' in data) {
			data.stripeMethods = data.stripeMethods.join(',');
		}
		data.currencies = data.currencies.join(',');

		if (paymentMethod.type === 'manual') {
			if ('stripeMethods' in data ||
				'stripeSecretKey' in data ||
				'stripePublishableKey' in data) {
				return res.type('text/plain').status(400).send('PaymentMethod is of type manual, and must not use stripe properties');
			}
		} else if (paymentMethod.type === 'stripe') {
			// Verify Stripe keys
			const stripe = new Stripe(data.stripeSecretKey, {
				apiVersion: AKSO.STRIPE_API_VERSION
			});
			try {
				await stripe.paymentIntents.list({ limit: 1 }); // random request to verify key
			} catch (e) {
				if (e.type === 'StripeAuthenticationError') {
					return res.sendStatus(409);
				}
				throw e;
			}
		}

		await AKSO.db('pay_methods')
			.where('id', req.params.paymentMethodId)
			.update(data);

		res.sendStatus(204);
	}
};
