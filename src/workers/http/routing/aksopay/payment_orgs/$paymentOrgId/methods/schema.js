import { analyze, union, NULL, NUMBER, BOOL, STRING, array as ascArray } from '@tejo/akso-script';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		type: 'f',
		stripeMethods: '',
		name: 'fs',
		internalDescription: 's',
		description: 's',
		descriptionPreview: 's',
		currencies: '',
		paymentValidity: '',
		maxAmount: '',
		isRecommended: 'f',
		internal: 'f',
		feePercent:  '',
		'feeFixed.val': '',
		'feeFixed.cur': '',
		stripePublishableKey: '',
		prices: '',
	},
	fieldAliases: {
		'feeFixed.val': 'feeFixed_val',
		'feeFixed.cur': 'feeFixed_cur'
	},
	alwaysSelect: [ 'type' ]
};

export const pricesSchema = {
	type: 'object',
	minProperties: 1,
	propertyNames: {
		format: 'string-year',
	},
	patternProperties: {
		'': {
			type: 'object',
			additionalProperties: false,
			required: [
				'registrationEntries'
			],
			properties: {
				registrationEntries: {
					type: 'object',
					additionalProperties: false,
					required: [
						'membershipCategories',
						'magazines',
					],
					properties: {
						membershipCategories: {
							type: 'array',
							maxItems: 255,
							items: {
								type: 'object',
								additionalProperties: false,
								required: [
									'id', 'commission', 'price',
								],
								properties: {
									id: {
										type: 'integer',
										format: 'uint32',
									},
									commission: {
										type: 'integer',
										minimum: 0,
										maximum: 100,
									},
									price: {
										type: 'object',
										nullable: true,
										additionalProperties: false,
										required: [
											'script', 'var',
										],
										properties: {
											script: {
												type: 'object',
											},
											var: {
												type: 'string',
												minLength: 1,
												maxLength: 40,
											},
										},
									},
								},
							},
						},
						magazines: {
							type: 'array',
							maxItems: 255,
							items: {
								type: 'object',
								additionalProperties: false,
								required: [
									'id', 'prices',
								],
								properties: {
									id: {
										type: 'integer',
										format: 'uint32',
									},
									prices: {
										type: 'object',
										additionalProperties: false,
										propertyNames: {
											enum: [
												'paper', 'access',
											],
										},
										patternProperties: {
											'': {
												type: 'object',
												nullable: true,
												additionalProperties: false,
												required: [
													'commission', 'script', 'var',
												],
												properties: {
													commission: {
														type: 'integer',
														minimum: 0,
														maximum: 100,
													},
													script: {
														type: 'object',
													},
													var: {
														type: 'string',
														minLength: 1,
														maxLength: 40,
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	},
};

export async function validatePrices (prices) {
	const priceFormVars = {
		birthdate: union([ STRING, NULL ]),
		age: union([ NUMBER, NULL ]),
		agePrimo: union([ NUMBER, NULL ]),
		feeCountry: union([ STRING, NULL ]),
		feeCountryGroups: ascArray(STRING),
		isActiveMember: BOOL,
		currency: STRING,
	};
	const assertValidPriceScript = function (price) {
		if (price === null) { return; }
		const analysis = analyze(price.script, price.var, priceFormVars);
		if (!analysis.valid) {
			const err = new Error(JSON.stringify(analysis));
			err.statusCode = 400;
			throw err;
		}
	};

	for (const yearPrices of Object.values(prices)) {
		const membershipCategoryIds = [];
		const magazineIds = [];

		for (const membershipCategory of yearPrices.registrationEntries.membershipCategories) {
			// Ensure unique membership category ids
			if (membershipCategoryIds.includes(membershipCategory.id)) {
				const err = new Error(`Duplicate membership category id ${membershipCategory.id}`);
				err.statusCode = 400;
				throw err;
			}
			membershipCategoryIds.push(membershipCategory.id);

			// Validate price script
			assertValidPriceScript(membershipCategory.price);
		}

		for (const magazine of yearPrices.registrationEntries.magazines) {
			// Ensure unique magazine ids
			if (magazineIds.includes(magazine.id)) {
				const err = new Error(`Duplicate magazine id ${magazine.id}`);
				err.statusCode = 400;
				throw err;
			}
			magazineIds.push(magazine.id);

			// Set defaults
			if (!('paper' in magazine.prices)) {
				magazine.prices.paper = null;
			}
			if (!('access' in magazine.prices)) {
				magazine.prices.access = null;
			}

			// Validate price scripts
			for (const price of Object.values(magazine.prices)) {
				assertValidPriceScript(price);
			}
		}

		// Ensure valid membership categories
		const existingMembershipCategoryIds = await AKSO.db('membershipCategories')
			.select('id')
			.whereIn('id', membershipCategoryIds)
			.pluck('id');
		const invalidMembershipCategoryIds = membershipCategoryIds
			.filter(x => !existingMembershipCategoryIds.includes(x));
		if (invalidMembershipCategoryIds.length) {
			const err = new Error(`Invalid membership categories: ${invalidMembershipCategoryIds.join(', ')}`);
			err.statusCode = 400;
			throw err;
		}

		// Ensure valid magazine ids
		const existingMagazineIds = await AKSO.db('magazines')
			.select('id')
			.whereIn('id', magazineIds)
			.pluck('id');
		const invalidMagazineIds = magazineIds
			.filter(x => !existingMagazineIds.includes(x));
		if (invalidMagazineIds.length) {
			const err = new Error(`Invalid magazines: ${invalidMagazineIds.join(', ')}`);
			err.statusCode = 400;
			throw err;
		}
	}
}
