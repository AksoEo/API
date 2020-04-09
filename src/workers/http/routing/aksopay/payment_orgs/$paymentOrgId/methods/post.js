import AKSOCurrency from 'akso/lib/enums/akso-currency';

import path from 'path';
import Stripe from 'stripe';
import { default as deepmerge } from 'deepmerge';

const allTypesProps = {
	type: {
		type: 'string'
	},
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
	}
};

export default {
	schema: {
		query: null,
		body: {
			oneOf: [ 'manual', 'stripe' ].map(type => {
				const props = deepmerge({}, allTypesProps);
				props.type.const = type;

				const required = [
					'type',
					'name',
					'currencies'
				];

				if (type === 'stripe') {
					props.stripeMethods = {
						type: 'array',
						uniqueItems: true,
						minItems: 1,
						items: {
							type: 'string',
							enum: [ 'card' ]
						}
					};
					required.push('stripeMethods');

					props.stripeSecretKey = {
						type: 'string',
						maxLength: 256
					};
					required.push('stripeSecretKey');

					props.stripePublishableKey = {
						type: 'string',
						maxLength: 256
					};
					required.push('stripePublishableKey');
				}

				return {
					type: 'object',
					properties: props,
					required: required,
					additionalProperties: false
				};
			})
		}
	},

	run: async function run (req, res) {
		// Make sure the payment org exists and is accessible
		const paymentOrg = await AKSO.db('pay_orgs')
			.where('id', req.params.paymentOrgId)
			.first('org');
		if (!paymentOrg) { return res.sendStatus(404); }
		if (!req.hasPermission('pay.payment_methods.create.' + paymentOrg.org)) {
			return res.sendStatus(403);
		}

		const data = {
			paymentOrgId: req.params.paymentOrgId,
			...req.body
		};
		if ('stripeMethods' in data) {
			data.stripeMethods = data.stripeMethods.join(',');
		}
		data.currencies = data.currencies.join(',');

		if (data.type === 'stripe') {
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
				e.statusCode = 500;
				throw e;
			}

			// Check if stripe secretKey has already been used elsewhere, in which case a webhook is not needed
			const webhookRegistered = await AKSO.db('pay_stripe_webhooks')
				.where('stripeSecretKey', data.stripeSecretKey)
				.first(1);
			if (!webhookRegistered) {
				// Register the webhook
				let webhookSecret, webhookId;
				try {
					const webhook = await stripe.webhookEndpoints.create({
						api_version: AKSO.STRIPE_API_VERSION,
						enabled_events: AKSO.STRIPE_WEBHOOK_EVENTS,
						url: new URL(AKSO.STRIPE_WEBHOOK_URL, AKSO.conf.http.outsideAddress).toString()
					});
					webhookSecret = webhook.secret;
					webhookId = webhook.id;
				} catch (e) {
					e.statusCode = 500;
					throw e;
				}

				await AKSO.db('pay_stripe_webhooks')
					.insert({
						stripeSecretKey: data.stripeSecretKey,
						stripeId: webhookId,
						secret: webhookSecret,
						apiVersion: AKSO.STRIPE_API_VERSION,
						enabledEvents: AKSO.STRIPE_WEBHOOK_EVENTS.join(',')
					});
			}
		}

		const id = (await AKSO.db('pay_methods').insert(data))[0];

		res.set('Location', path.join(
			AKSO.conf.http.path,
			'aksopay/payment_orgs',
			req.params.paymentOrgId,
			'methods',
			id.toString()
		));
		res.set('X-Identifier', id.toString());
		res.sendStatus(201);
	}
};
