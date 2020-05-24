import { TRIGGER_TYPES } from './schema';
import AKSOOrganization from 'akso/lib/enums/akso-organization';
import AKSOCurrency from 'akso/lib/enums/akso-currency';
import AKSOPayPaymentMethodResource from 'akso/lib/resources/aksopay-payment-method-resource';
import paymentMethodSchema from 'akso/workers/http/routing/aksopay/payment_orgs/$paymentOrgId/methods/schema';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import path from 'path';
import crypto from 'pn/crypto';
import Stripe from 'stripe';
import moment from 'moment-timezone';
import { base32 } from 'rfc4648';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				codeholderId: {
					type: 'integer',
					format: 'uint32',
					nullable: true,
					default: null
				},
				customer: {
					type: 'object',
					properties: {
						email: {
							type: 'string',
							format: 'email',
							minLength: 1,
							maxLength: 250
						},
						name: {
							type: 'string',
							pattern: '^[^\\n]+$',
							minLength: 1,
							maxLength: 100
						}
					},
					required: [
						'email', 'name'
					],
					additionalProperties: false
				},
				paymentOrgId: {
					type: 'integer',
					format: 'uint16'
				},
				paymentMethodId: {
					type: 'integer',
					format: 'uint32'
				},
				currency: {
					type: 'string'
				},
				internalNotes: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				},
				customerNotes: {
					type: 'string',
					minLength: 1,
					maxLength: 5000,
					nullable: true
				},
				foreignId: {
					type: 'string',
					minLength: 1,
					maxLength: 500,
					nullable: true
				},
				purposes: {
					type: 'array',
					minItems: 1,
					maxItems: 1024,
					items: {
						oneOf: [
							{
								type: 'object',
								properties: {
									type: {
										type: 'string',
										const: 'trigger'
									},
									trigger: {
										type: 'string',
										enum: TRIGGER_TYPES
									},
									id: {
										type: 'string',
										minLength: 1,
										maxLength: 500,
										nullable: true
									},
									amount: {
										type: 'integer',
										format: 'uint32'
									},
									title: {
										type: 'string',
										minLength: 1,
										maxLength: 128,
										pattern: '^[^\\n]+$'
									},
									description: {
										type: 'string',
										minLength: 1,
										maxLength: 5000,
										nullable: true
									}
								},
								required: [
									'type',
									'trigger',
									'amount',
									'title'
								],
								additionalProperties: false
							},
							{
								type: 'object',
								properties: {
									type: {
										type: 'string',
										const: 'addon'
									},
									paymentAddonId: {
										type: 'integer',
										format: 'uint32'
									},
									amount: {
										type: 'integer',
										format: 'uint32'
									}
								},
								required: [
									'type',
									'paymentAddonId',
									'amount'
								],
								additionalProperties: false
							},
							{
								type: 'object',
								properties: {
									type: {
										type: 'string',
										const: 'manual'
									},
									amount: {
										type: 'integer',
										format: 'int32'
									},
									title: {
										type: 'string',
										minLength: 1,
										maxLength: 128,
										pattern: '^[^\\n]+$'
									},
									description: {
										type: 'string',
										minLength: 1,
										maxLength: 5000,
										nullable: true
									}
								},
								required: [
									'type',
									'amount',
									'title',
									'description'
								],
								additionalProperties: false
							}
						]
					}
				}
			},
			required: [
				'customer',
				'currency',
				'purposes',
				'paymentOrgId',
				'paymentMethodId'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Check perms
		const orgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.read.' + org));
		if (!orgs.length) { return res.sendStatus(403); }

		// Get the PaymentMethod
		const paymentMethodRaw = await AKSO.db('pay_methods')
			.innerJoin('pay_orgs', 'paymentOrgId', 'pay_orgs.id')
			.where({
				paymentOrgId: req.body.paymentOrgId,
				'pay_methods.id': req.body.paymentMethodId
			})
			.whereIn('org', orgs)
			.first('pay_methods.*', 'org');
		if (!paymentMethodRaw) {
			return res.type('text/plain').status(400).send('PaymentMethod not found');
		}
		const paymentMethod = new AKSOPayPaymentMethodResource({...paymentMethodRaw}, {
			query: { fields: Object.keys(paymentMethodSchema.fields) }}).obj;

		// Make sure the codeholder exists
		if (req.body.codeholderId !== null) {
			const codeholderQuery = AKSO.db('view_codeholders')
				.where('id', req.body.codeholderId)
				.first(1);
			memberFilter(codeholderSchema, codeholderQuery, req);
			if (!await codeholderQuery) {
				return res.type('text/plain').status(400).send('Codeholder not found');
			}
		}

		// Make sure the currency is supported
		if (!paymentMethod.currencies.includes(req.body.currency)) {
			return res.type('text/plain').status(400).send('Currency not supported by PaymentMethod');
		}

		// Format the stored purposes, sum amounts to totalAmount
		let totalAmount = 0;
		const storedPurposes = await Promise.all(req.body.purposes.map(async purpose => {
			if (purpose.type === 'trigger') {
				totalAmount += purpose.amount;
				return purpose;

			} else if (purpose.type === 'addon') {
				totalAmount += purpose.amount;

				const addon = await AKSO.db('pay_addons')
					.where({
						id: purpose.paymentAddonId,
						paymentOrgId: paymentMethodRaw.paymentOrgId
					})
					.first('id', 'name', 'description');
				if (!addon) {
					return res.type('text/plain').status(400)
						.send(`PaymentAddon#id=${purpose.paymentAddonId} not found`);
				}
				purpose.paymentAddon = addon;
				return purpose;

			} else if (purpose.type === 'manual') {
				totalAmount += purpose.amount;
				return purpose;
			}
		}));
		if (!AKSO.cashify) { return res.sendStatus(503); }
		const currencyZeroDecimalFactor = AKSOCurrency.getZeroDecimalFactor(req.body.currency);
		const totalAmountInUSD = AKSO.cashify.convert(totalAmount / currencyZeroDecimalFactor, { from: req.body.currency, to: 'USD' });
		if (totalAmountInUSD < 1) {
			totalAmount = Math.round(
				AKSO.cashify.convert(1, { from: 'USD', to: req.body.currency })
					* currencyZeroDecimalFactor
			);
		} else if (totalAmountInUSD > 500000) {
			totalAmount = Math.round(
				AKSO.cashify.convert(500000, { from: 'USD', to: req.body.currency })
					* currencyZeroDecimalFactor
			);
		}

		const id = await crypto.randomBytes(15);
		const idEncoded = base32.stringify(id);

		let stripePaymentIntentId,
			stripeClientSecret,
			stripeClient			= null;
		if (paymentMethod.type === 'stripe') {
			try {
				stripeClient = new Stripe(paymentMethodRaw.stripeSecretKey, {
					apiVersion: AKSO.STRIPE_API_VERSION
				});

				// TODO: Improve error handling
				const stripePaymentIntent = await stripeClient.paymentIntents.create({
					amount: totalAmount,
					currency: req.body.currency.toLowerCase(),
					payment_method_types: paymentMethod.stripeMethods,
					metadata: {
						aksopay_id: idEncoded
					},
					description: 'AKSOPay-pago',
					receipt_email: req.body.customer.email
				});
				stripePaymentIntentId = stripePaymentIntent.id;
				stripeClientSecret = stripePaymentIntent.client_secret;
			} catch (e) {
				e.statusCode = 500;
				throw e;
			}
		}

		const currentTime = moment().unix();
		const data = {
			id: id,
			codeholderId: req.body.codeholderId,
			customer_email: req.body.customer.email,
			customer_name: req.body.customer.name,
			paymentOrgId: req.body.paymentOrgId,
			paymentMethodId: req.body.paymentMethodId,
			paymentMethod: JSON.stringify(paymentMethod),
			org: paymentMethodRaw.org,
			currency: req.body.currency,
			status: 'pending',
			timeCreated: currentTime,
			statusTime: currentTime,
			internalNotes: req.body.internalNotes,
			customerNotes: req.body.customerNotes,
			foreignId: req.body.foreignId,
			stripePaymentIntentId: stripePaymentIntentId,
			stripeClientSecret: stripeClientSecret,
			stripeSecretKey: paymentMethodRaw.stripeSecretKey,
			purposes: JSON.stringify(storedPurposes),
			totalAmount: totalAmount
		};

		await AKSO.db('pay_intents').insert(data);

		res.set('Location', path.join(AKSO.conf.http.path, 'aksopay/payment_intents', idEncoded));
		res.set('X-Identifier', idEncoded);
		res.sendStatus(201);
	}
};
