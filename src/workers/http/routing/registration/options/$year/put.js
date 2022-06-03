import { analyze, union, NULL, NUMBER, BOOL, STRING, array as ascArray } from '@tejo/akso-script';

import AKSOCurrency from 'akso/lib/enums/akso-currency';

import { schema as parSchema } from '../schema';

const priceObjSchema = {
	type: 'object',
	nullable: true,
	properties: {
		script: {
			type: 'object'
		},
		var: {
			type: 'string',
			minLength: 1,
			maxLength: 40
		},
		description: {
			type: 'string',
			minLength: 1,
			maxLength: 500,
			nullable: true
		}
	},
	required: [
		'script',
		'var'
	],
	additionalProperties: false
};

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: {
			type: 'object',
			properties: {
				enabled: {
					type: 'boolean'
				},
				paymentOrgId: {
					type: 'number',
					format: 'uint16'
				},
				currency: {
					type: 'string',
					enum: AKSOCurrency.all
				},
				offers: {
					type: 'array',
					minItems: 1,
					maxItems: 512,
					items: {
						type: 'object',
						properties: {
							title: {
								type: 'string',
								pattern: '^[^\\n]+$',
								minLength: 1,
								maxLength: 120
							},
							description: {
								type: 'string',
								minLength: 1,
								maxLength: 4000,
								nullable: true
							},
							offers: {
								type: 'array',
								minItems: 0,
								maxItems: 64,
								items: {
									oneOf: [
										// addon
										{
											type: 'object',
											properties: {
												type: {
													type: 'string',
													const: 'addon'
												},
												id: {
													type: 'number',
													format: 'uint32'
												}
											},
											required: [
												'type',
												'id'
											],
											additionalProperties: false
										},
										// membership
										{
											type: 'object',
											properties: {
												type: {
													type: 'string',
													const: 'membership'
												},
												id: {
													type: 'number',
													format: 'uint32'
												},
												price: priceObjSchema
											},
											required: [
												'type',
												'id'
											],
											additionalProperties: false
										},
										// magazine
										{
											type: 'object',
											properties: {
												type: {
													type: 'string',
													const: 'magazine'
												},
												id: {
													type: 'number',
													format: 'uint32'
												},
												price: priceObjSchema,
												paperVersion: {
													type: 'boolean'
												}
											},
											required: [
												'type',
												'id'
											],
											additionalProperties: false
										}
									]
								}
							}
						},
						required: [
							'title'
						],
						additionalProperties: false
					}
				}
			},
			required: [
				'paymentOrgId',
				'currency',
				'offers'
			],
			additionalProperties: false
		},
		requirePerms: 'registration.options.update'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check org perms
		let orgData = await AKSO.db('pay_orgs')
			.where('id', req.body.paymentOrgId)
			.first('org');
		if (!orgData) {
			// The payment org does not exist
			return res.type('text/plain').status(400)
				.send('Unknown payment org');
		}
		if (!req.hasPermission('pay.read.' + orgData.org)) {
			return res.sendStatus(403);
		}
		
		const priceFormVars = {
			birthdate: union([ STRING, NULL ]),
			age: union([ NUMBER, NULL ]),
			agePrimo: union([ NUMBER, NULL ]),
			feeCountry: union([ STRING, NULL ]),
			feeCountryGroups: ascArray(STRING),
			isActiveMember: BOOL
		};

		for (const offerGroup of req.body.offers) {
			if (!offerGroup.offers) { continue; }
			for (const offer of offerGroup.offers) {
				if (offer.type === 'addon') {
					// Validate the id
					const addonExists = await AKSO.db('pay_addons')
						.where({
							id: offer.id,
							paymentOrgId: req.body.paymentOrgId
						})
						.first(1);
					if (!addonExists) {
						return res.type('text/plain').status(400)
							.send(`Unknown payment addon ${offer.id}`);
					}
				} else if (offer.type === 'membership') {
					// Validate the id
					const mcExists = await AKSO.db('membershipCategories')
						.where('id', offer.id)
						.first(1);
					if (!mcExists) {
						return res.type('text/plain').status(400)
							.send(`Unknown membership category ${offer.id}`);
					}
				} else if (offer.type === 'magazine') {
					// Validate the id
					const magazineExists = await AKSO.db('magazines')
						.where('id', offer.id)
						.first(1);
					if (!magazineExists) {
						return res.type('text/plain').status(400)
							.send(`Unknown magazine ${offer.id}`);
					}
				}

				if (offer.price) {
					// Validate the price script
					const analysis = analyze(offer.price.script, offer.price.var, priceFormVars);
					if (!analysis.valid) {
						const err = new Error(JSON.stringify(analysis));
						err.statusCode = 400;
						throw err;
					}
				}
			}
		}

		// Create/update the registration options
		const alreadyExists = await AKSO.db('registration_options')
			.where('year', req.params.year)
			.first(1);
		const trx = await req.createTransaction();

		const registrationOptions = {
			year: req.params.year,
			enabled: req.body.enabled,
			paymentOrgId: req.body.paymentOrgId,
			currency: req.body.currency
		};
		if (!alreadyExists) {
			await trx('registration_options')
				.insert(registrationOptions);
		} else {
			await trx('registration_options')
				.where('year', req.params.year)
				.update(registrationOptions);
		}

		// Delete current offer groups
		// This automatically deletes all offers by foreign key
		await trx('registration_options_offerGroups')
			.where('year', req.params.year)
			.delete();

		// Insert new offer groups
		await trx('registration_options_offerGroups')
			.insert(req.body.offers.map((offerGroup, i) => {
				return {
					year: req.params.year,
					id: i,
					title: offerGroup.title,
					description: offerGroup.description
				};
			}));

		// Insert new offers
		const offers = req.body.offers.flatMap((offerGroup, offerGroupId) => {
			if (!offerGroup.offers) { return []; }
			return offerGroup.offers.map((offer, i) => {
				const offerData = {
					year: req.params.year,
					offerGroupId,
					id: i,
					type: offer.type
				};

				if (offer.type === 'addon') {
					offerData.paymentAddonId = offer.id;
				} else if (offer.type === 'membership') {
					offerData.membershipCategoryId = offer.id;
				} else if (offer.type === 'magazine') {
					offerData.magazineId = offer.id;
					offerData.paperVersion = offer.paperVersion;
				}

				if (offer.price) {
					offerData.price_script      = JSON.stringify(offer.price.script);
					offerData.price_var         = offer.price.var;
					offerData.price_description = offer.price.description;
				}

				return offerData;
			});
		});
		if (offers.length) {
			await trx('registration_options_offerGroups_offers')
				.insert(offers);
		}

		await trx.commit();

		res.sendStatus(204);
	}
};
