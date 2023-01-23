import AKSOCurrency from 'akso/lib/enums/akso-currency';
import { getStripe, ensureWebhook } from 'akso/lib/stripe';

import { pricesSchema, validatePrices } from './schema';

import path from 'path';
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
		nullable: true,
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
	maxAmount: {
		type: 'integer',
		format: 'uint32',
		nullable: true,
	},
	isRecommended: {
		type: 'boolean'
	},
	feePercent: {
		type: 'number',
		nullable: true,
		exclusiveMinimum: 0,
		exclusiveMaximum: 1,
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
	}
};

export default {
	schema: {
		query: null,
		body: {
			oneOf: [
				'manual', 'stripe', 'intermediary'
			].map(type => {
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
				} else if (type === 'intermediary') {
					props.prices = pricesSchema;
					required.push('prices');
				}

				return {
					type: 'object',
					properties: props,
					required,
					additionalProperties: false,
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

		if (data.type === 'stripe') {
			// Verify Stripe key
			await getStripe(data.stripeSecretKey, true);
			await ensureWebhook(data.stripeSecretKey);
		} else if (data.type === 'intermediary') {
			await validatePrices(data.prices);
		}

		if ('stripeMethods' in data) {
			data.stripeMethods = data.stripeMethods.join(',');
		}
		if ('prices' in data) {
			data.prices = JSON.stringify(data.prices);
		}
		data.currencies = data.currencies.join(',');
		if (data.feeFixed) {
			data.feeFixed_val = data.feeFixed.val;
			data.feeFixed_cur = data.feeFixed.cur;
		}
		delete data.feeFixed;

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
