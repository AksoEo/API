import AKSOCurrency from 'akso/lib/enums/akso-currency';
import { getStripe } from 'akso/lib/stripe';

import { pricesSchema, validatePrices } from '../schema';

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
				internal: {
					type: 'boolean',
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				},
				descriptionPreview: {
					type: 'string',
					minLength: 1,
					maxLength: 2000,
					nullable: true
				},
				currencies: {
					type: 'array',
					items: {
						type: 'string',
						enum: AKSOCurrency.all
					}
				},
				maxAmount: {
					type: 'integer',
					format: 'uint32',
					nullable: true,
				},
				paymentValidity: {
					type: 'integer',
					format: 'uint32',
					nullable: true
				},
				isRecommended: {
					type: 'boolean'
				},
				feePercent: {
					type: 'number',
					nullable: true,
					exclusiveMinimum: 0,
					exclusiveMaximum: 1
				},
				feeFixed: {
					type: 'object',
					properties: {
						val: {
							type: 'integer',
							format: 'uint16'
						},
						cur: {
							type: 'string',
							enum: AKSOCurrency.all
						}
					},
					required: [ 'val', 'cur' ],
					nullable: true,
					additionalProperties: false
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
				},
				prices: pricesSchema
			},
			minProperties: 1,
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the payment method exists and is accessible
		const paymentMethod = await AKSO.db('pay_methods')
			.innerJoin('pay_orgs', 'paymentOrgId', 'pay_orgs.id')
			.where({
				'pay_methods.id': req.params.paymentMethodId,
				'pay_orgs.id': req.params.paymentOrgId,
			})
			.first('org', 'type', 'stripeSecretKey');
		if (!paymentMethod) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_methods.update.' + paymentMethod.org)) {
			return res.sendStatus(403);
		}

		const data = { ...req.body };

		if (paymentMethod.type === 'manual') {
			if ('stripeMethods' in data ||
				'stripeSecretKey' in data ||
				'stripePublishableKey' in data ||
				'prices' in data) {
				return res.type('text/plain').status(400)
					.send('Illegal properties used with payment method type manual');
			}
		} else if (paymentMethod.type === 'stripe') {
			if ('prices' in data) {
				return res.type('text/plain').status(400)
					.send('Illegal properties used with payment method type stripe');
			}

			// Verify Stripe keys
			if ('stripeSecretKey' in data) {
				await getStripe(data.stripeSecretKey, true);
				await ensureWebhook(data.stripeSecretKey);

				// Delete old webhook
				const oldWebhook = await AKSO.db('pay_stripe_webhooks')
					.where('stripeSecretKey', paymentMethod.stripeSecretKey)
					.first('stripeId');
				try {
					await stripeClient.webhookEndpoints.del(oldWebhook.stripeId);
				} catch (e) {
					if (e.statusCode !== 404) {
						e.statusCode = 500;
						throw e;
					}
				}
				await AKSO.db('pay_stripe_webhooks')
					.where('stripeSecretKey', paymentMethod.stripeSecretKey)
					.delete();
			}
		} else if (paymentMethod.type === 'intermediary') {
			if ('stripeMethods' in data ||
				'stripeSecretKey' in data ||
				'stripePublishableKey' in data) {
				return res.type('text/plain').status(400)
					.send('Illegal properties used with payment method type intermediary');
			}

			if ('prices' in data) {
				await validatePrices(data.prices);
			}
		}

		if ('stripeMethods' in data) {
			data.stripeMethods = data.stripeMethods.join(',');
		}
		if ('currencies' in data) {
			data.currencies = data.currencies.join(',');
		}
		if (data.feeFixed) {
			data.feeFixed_val = data.feeFixed.val;
			data.feeFixed_cur = data.feeFixed.cur;
			delete data.feeFixed;
		}
		if ('prices' in data) {
			data.prices = JSON.stringify(data.prices);
		}

		await AKSO.db('pay_methods')
			.where('id', req.params.paymentMethodId)
			.update(data);

		res.sendStatus(204);
	}
};
