import { purposeSchema } from './schema';
import AKSOOrganization from 'akso/lib/enums/akso-organization';
import AKSOCurrency from 'akso/lib/enums/akso-currency';
import AKSOPayPaymentMethodResource from 'akso/lib/resources/aksopay-payment-method-resource';
import { schema as paymentMethodSchema } from 'akso/workers/http/routing/aksopay/payment_orgs/$paymentOrgId/methods/schema';
import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';
import { sendInstructionsEmail } from 'akso/lib/aksopay-intent-util';
import { getStripe } from 'akso/lib/stripe';

import path from 'path';
import crypto from 'pn/crypto';
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
					nullable: true,
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
					items: purposeSchema
				},
				intermediaryCountryCode: {
					type: 'string',
					pattern: '^[a-z]{2}$',
				},
				intermediaryIdentifier: {
					type: 'object',
					properties: {
						year: {
							type: 'number',
							format: 'year',
						},
						number: {
							type: 'integer',
							format: 'uint16',
						},
					},
					required: [ 'year', 'number' ],
					additionalProperties: false,
				},
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
		const fullPermOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.create.' + org));
		const intermediaryOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('pay.payment_intents.intermediary.' + org));
		const orgs = fullPermOrgs.concat(intermediaryOrgs);
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
			return res.type('text/plain').status(400)
				.send('PaymentMethod not found');
		}

		const paymentMethod = new AKSOPayPaymentMethodResource({...paymentMethodRaw}, {
			query: { fields: Object.keys(paymentMethodSchema.fields) }}).obj;

		// Intermediary perms checks
		if (paymentMethod.type !== 'intermediary') {
			if (!fullPermOrgs.includes(paymentMethodRaw.org)) {
				return res.type('text/plain').status(400)
					.send('PaymentMethod not found');
			}
		} else {
			const perm = `pay.payment_intents.intermediary.${paymentMethodRaw.org}.${req.body.intermediaryCountryCode}`;
			if (!req.hasPermission(perm)) {
				return res.type('text/plain').status(400)
					.send('PaymentMethod not found');
			}
		}

		// Intermediary only fields
		if (paymentMethod.type === 'intermediary') {
			if (!req.body.intermediaryCountryCode) {
				return res.type('text/plain').status(400)
					.send('Intermediary payment intents must have the property intermediaryCountryCode');
			}
			const countryExists = await AKSO.db('countries')
				.first(1)
				.where({
					enabled: true,
					code: req.body.intermediaryCountryCode,
				});
			if (!countryExists) {
				return res.type('text/plain').status(400)
					.send('Invalid or disabled intermediaryCountryCode');
			}
			const perm = `pay.payment_intents.intermediary.${paymentMethod.org}.${req.body.intermediaryCountryCode}`;
			if (!req.hasPermission(perm)) {
				return res.type('text/plain').status(403)
					.send(`Missing permission ${perm}`);
			}

			if (!req.body.intermediaryIdentifier) {
				return res.type('text/plain').status(400)
					.send('Intermediary payment intents must have the property intermediaryIdentifier');
			}
			const identifierTaken = await AKSO.db('pay_intents')
				.first(1)
				.where({
					org: paymentMethodRaw.org,
					intermediaryCountryCode: req.body.intermediaryCountryCode,
					intermediaryIdentifier_year: req.body.intermediaryIdentifier.year,
					intermediaryIdentifier_number: req.body.intermediaryIdentifier.number,
				});
			if (identifierTaken) {
				return res.type('text/plain').status(400)
					.send('intermediaryIdentifier is taken');
			}
		} else {
			if ('intermediaryCountryCode' in req.body ||
				'intermediaryIdentifier' in req.body) {
				return res.type('text/plain').status(400)
					.send('Intermediary only fields used with a non-intermediary payment method');
			}
		}

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

		// Make sure customer is null only when allowed
		if (paymentMethod.type === 'stripe' && req.body.customer === null) {
			return res.type('text/plain').status(400)
				.send('customer may not be null when using stripe');
		}

		// Validate purposes
		let totalAmount = 0;
		for (const purpose of req.body.purposes) {
			totalAmount += purpose.amount;
			if (purpose.type === 'addon') {
				// Verify addon existence
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
			} else if (purpose.type === 'trigger') {
				if (purpose.triggers === 'congress_registration') {
					// Fetch congress org
					const congressData = await AKSO.db('congresses_instances_participants')
						.innerJoin('congresses_instances', 'congressInstanceId', '=', 'congresses_instances.id')
						.innerJoin('congresses', 'congressId', '=', 'congresses.id')
						.first('org')
						.where('dataId', purpose.dataId);
					if (!congressData || !req.hasPermission('congress_instances.participants.update.' + congressData.org)) {
						return res.type('text/plain').status(400)
							.send(`dataId ${purpose.dataId.toString('hex')} not found or permission missing`);
					}
				} else if (purpose.triggers === 'registration_entry') {
					// Fetch registration options org
					const registrationOptions = await AKSO.db('registration_entries')
						.innerJoin('registration_options', 'registration_options.year', 'registration_entries.year')
						.innerJoin('pay_orgs', 'pay_orgs.id', 'registration_options.paymentOrgId')
						.first('org')
						.where('registration_entries.id', purpose.registrationEntryId);
					if (!registrationOptions || !req.hasPermission('registration.entries.update')) {
						return res.type('text/plain').status(400)
							.send('Unknown registrationEntryId or missing permission');
					}
				}
			}
		}

		// Load cashify
		if (!AKSO.cashify) { return res.sendStatus(503); }
		const currencyZeroDecimalFactor = AKSOCurrency.getZeroDecimalFactor(req.body.currency);

		// Add fees if they exist
		if (paymentMethod.feePercent || paymentMethod.feeFixed) {
			const feePurpose = {
				type: 'manual',
				amount: 0,
				title: 'Kotizo pro pagmaniero'
			};

			// Add percentage fee, if it exists
			if (paymentMethod.feePercent) {
				const percentFee = Math.round(totalAmount * paymentMethod.feePercent);

				feePurpose.amount += percentFee;
				totalAmount += percentFee;

				feePurpose.description = `Pagmaniera kotizo de ${(paymentMethod.feePercent * 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
			}

			// Add fixed fee, if it exists
			if (paymentMethod.feeFixed) {
				const feeZeroDecimalFactor = AKSOCurrency.getZeroDecimalFactor(paymentMethod.feeFixed.cur);
				const feeInIntentCur = Math.round(currencyZeroDecimalFactor *
					AKSO.cashify.convert(paymentMethod.feeFixed.val / feeZeroDecimalFactor, { from: paymentMethod.feeFixed.cur, to: req.body.currency }));
				
				feePurpose.amount += feeInIntentCur;
				totalAmount += feeInIntentCur;

				const formattedFee = `${(feeInIntentCur / currencyZeroDecimalFactor).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${req.body.currency}`;
				if (paymentMethod.feePercent) {
					feePurpose.description += ` + ${formattedFee}`;
				} else {
					feePurpose.description = `Pagmaniera kotizo de ${formattedFee}`;
				}
			}

			req.body.purposes.push(feePurpose);
		}

		const totalAmountInUSD = AKSO.cashify.convert(totalAmount / currencyZeroDecimalFactor, { from: req.body.currency, to: 'USD' });
		if (totalAmountInUSD < 1) {
			const minimumAmount = Math.round(
				AKSO.cashify.convert(1, { from: 'USD', to: req.body.currency })
					* currencyZeroDecimalFactor
			);
			const minimumAmountDelta = minimumAmount - totalAmount;

			req.body.purposes.push({
				type: 'manual',
				amount: minimumAmountDelta,
				title: 'Kotizo pro pagsumo sub minimumo',
				description: 'Ne eblas pagi malpli ol 1 USD, tial necesas krompageto'
			});
			totalAmount = minimumAmount;
		} else if (totalAmountInUSD > 500000) {
			return res.type('text/plain').status(417)
				.send('Payments may not have a total amount of more than USD 500,000');
		} else if (paymentMethod.maxAmount !== null && totalAmountInUSD > paymentMethod.maxAmount) {
			return res.type('text/plain').status(400)
				.send('Payments may not have a total amount exceeding the payment method\'s max amount.');
		}

		const id = await crypto.randomBytes(15);
		const idEncoded = base32.stringify(id);

		let stripePaymentIntentId,
			stripeClientSecret,
			stripeClient			= null;
		if (paymentMethod.type === 'stripe') {
			try {
				stripeClient = await getStripe(paymentMethodRaw.stripeSecretKey);

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
			customer_email: req.body.customer ? req.body.customer.email : null,
			customer_name: req.body.customer ? req.body.customer.name : null,
			paymentOrgId: req.body.paymentOrgId,
			paymentMethodId: req.body.paymentMethodId,
			paymentMethod: JSON.stringify(paymentMethod),
			org: paymentMethodRaw.org,
			currency: req.body.currency,
			status: 'pending',
			timeCreated: currentTime,
			createdBy: req.user.modBy,
			statusTime: currentTime,
			internalNotes: req.body.internalNotes,
			customerNotes: req.body.customerNotes,
			foreignId: req.body.foreignId,
			stripePaymentIntentId: stripePaymentIntentId,
			stripeClientSecret: stripeClientSecret,
			stripeSecretKey: paymentMethodRaw.stripeSecretKey,
			intermediaryCountryCode: req.body.intermediaryCountryCode,
			intermediaryIdentifier_year: req.body.intermediaryIdentifier ? req.body.intermediaryIdentifier.year : null,
			intermediaryIdentifier_number: req.body.intermediaryIdentifier ? req.body.intermediaryIdentifier.number : null,
		};

		const trx = await req.createTransaction();

		await trx('pay_intents').insert(data);

		await trx('pay_intents_purposes').insert(req.body.purposes.map((purpose, index) => {
			return {
				paymentIntentId: id,
				pos: index,
				type: purpose.type,
				amount: purpose.amount,
				originalAmount: purpose.originalAmount
			};
		}));

		for (const [index, purpose] of Object.entries(req.body.purposes)) {
			const purposeDB = {
				paymentIntentId: id,
				pos: index
			};

			if (purpose.type === 'addon') {
				purposeDB.paymentAddonId = purpose.paymentAddonId;
				purposeDB.paymentAddon = JSON.stringify(purpose.paymentAddon);
				purposeDB.description = purpose.description;

			} else if (purpose.type === 'manual') {
				purposeDB.title = purpose.title;
				purposeDB.description = purpose.description;

			} else if (purpose.type === 'trigger') {
				purposeDB.triggers = purpose.triggers;
				purposeDB.title = purpose.title;
				purposeDB.description = purpose.description;

				if (purpose.triggerAmount) {
					purposeDB.triggerAmount_amount = purpose.triggerAmount.amount;
					purposeDB.triggerAmount_currency = purpose.triggerAmount.currency;
				}
			}

			await trx('pay_intents_purposes_' + purpose.type).insert(purposeDB);

			if (purpose.type === 'trigger') {
				const triggerPurposeDB = {
					paymentIntentId: id,
					pos: index
				};

				if (purpose.triggers === 'congress_registration') {
					triggerPurposeDB.dataId = purpose.dataId;
				} else if (purpose.triggers === 'registration_entry') {
					triggerPurposeDB.registrationEntryId = purpose.registrationEntryId;
				}

				await trx('pay_intents_purposes_trigger_' + purpose.triggers).insert(triggerPurposeDB);
			}
		}

		await trx.commit();

		res.set('Location', path.join(AKSO.conf.http.path, 'aksopay/payment_intents', idEncoded));
		res.set('X-Identifier', idEncoded);
		res.sendStatus(201);

		// Send payment instructions email if applicable
		if (paymentMethod.type !== 'stripe' && req.body.customer?.email && !paymentMethod.internal) {
			await sendInstructionsEmail(id);
		}
	}
};
