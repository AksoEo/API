import { default as deepmerge } from 'deepmerge';

import QueryUtil from 'akso/lib/query-util';
import AKSOCurrency from 'akso/lib/enums/akso-currency';

export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		codeholderId: 'f',
		'customer.email': 'fs',
		'customer.name': 'fs',
		paymentOrgId: 'f',
		paymentMethodId: 'f',
		paymentMethod: '',
		org: 'f',
		currency: 'f',
		status: 'f',
		events: '',
		timeCreated: 'f',
		createdBy: 'f',
		statusTime: 'f',
		succeededTime: 'f',
		refundedTime: 'f',
		internalNotes: 's',
		customerNotes: 's',
		foreignId: 'f',
		stripePaymentIntentId: '',
		stripeClientSecret: '',
		purposes: '',
		totalAmount: 'f',
		amountRefunded: 'f',
		intermediaryCountryCode: 'f',
		'intermediaryIdentifier.year': 'f',
		'intermediaryIdentifier.number': 'f',
	},
	fieldAliases: {
		'intermediaryIdentifier.year': 'intermediaryIdentifier_year',
		'intermediaryIdentifier.number': 'intermediaryIdentifier_number',
		'customer.email': 'customer_email',
		'customer.name': 'customer_name',
		purposes: () => AKSO.db.raw('1'),
		events: () => AKSO.db.raw('1'),
		totalAmount: () => AKSO.db.raw('CAST((SELECT SUM(amount) from pay_intents_purposes where paymentIntentId = id) AS UNSIGNED INTEGER)')
	},
	alwaysSelect: [
		'id', 'paymentMethod', 'org'
	],
	customFilterLogicOps: {
		$purposes: ({ query, filter } = {}) => {
			if (typeof filter !== 'object' || filter === null || Array.isArray(filter)) {
				const err = new Error('$purposes expects an object');
				err.statusCode = 400;
				throw err;
			}
			query.whereExists(function () {
				this.select(1)
					.from('view_pay_intents_purposes')
					.whereRaw('`view_pay_intents_purposes`.`paymentIntentId` = `pay_intents`.`id`');

				QueryUtil.filter({
					fields: {
						type: 'f',
						invalid: 'f',
						amount: 'f',
						originalAmount: 'f',
						paymentAddonId: 'f',
						triggers: 'f',
						triggerStatus: 'f',
						dataId: 'f',
					},
					fieldAliases: {
						dataId: () => AKSO.db.raw('COALESCE(trigger_congress_registration_dataId, trigger_registration_entry_registrationEntryId)'),
					},
					query: this,
					filter
				});
			});
		}
	}
};

export async function afterQuery (arr, done) {
	if (!arr.length) { return done(); }

	const ids = arr.map(row => row.id);

	if (arr[0].events) {
		const eventsArr = await AKSO.db('pay_intents_events')
			.select('paymentIntentId', 'time', 'status')
			.whereIn('paymentIntentId', ids)
			.orderBy('id');
		const eventsObj = {};
		for (const event of eventsArr) {
			if (!(event.paymentIntentId in eventsObj)) {
				eventsObj[event.paymentIntentId] = [];
			}
			eventsObj[event.paymentIntentId].push({
				status: event.status,
				time: event.time
			});
		}
		for (const row of arr) {
			row.events = eventsObj[row.id];
		}
	}

	if (arr[0].purposes) {
		const purposesArr = await AKSO.db('view_pay_intents_purposes')
			.select('*')
			.whereIn('paymentIntentId', ids)
			.orderBy('paymentIntentId', 'pos');
		const purposesObj = {};
		for (const purpose of purposesArr) {
			let purposeFormatted = {
				type: purpose.type,
				invalid: !!purpose.invalid,
				amount: purpose.amount,
				originalAmount: purpose.originalAmount
			};

			if (purpose.type === 'addon') {
				purposeFormatted.paymentAddonId = purpose.paymentAddonId;
				purposeFormatted.paymentAddon = purpose.paymentAddon;
				purposeFormatted.description = purpose.description;
			} else if (purpose.type === 'manual') {
				purposeFormatted.title = purpose.title;
				purposeFormatted.description = purpose.description;
			} else if (purpose.type === 'trigger') {
				purposeFormatted.triggers = purpose.triggers;
				purposeFormatted.title = purpose.title;
				purposeFormatted.description = purpose.description;
				purposeFormatted.triggerStatus = purpose.triggerStatus;

				if (purpose.triggerAmount_amount) {
					purposeFormatted.triggerAmount = {
						amount: purpose.triggerAmount_amount,
						currency: purpose.triggerAmount_currency
					};
				} else {
					purposeFormatted.triggerAmount = null;
				}

				if (purpose.triggers === 'congress_registration') {
					purposeFormatted.dataId = purpose.trigger_congress_registration_dataId;
				} else if (purpose.triggers === 'registration_entry') {
					purposeFormatted.registrationEntryId = purpose.trigger_registration_entry_registrationEntryId;
				}
			}

			if (!(purpose.paymentIntentId in purposesObj)) {
				purposesObj[purpose.paymentIntentId] = [];
			}
			purposesObj[purpose.paymentIntentId].push(purposeFormatted);
		}
		for (const row of arr) {
			row.purposes = purposesObj[row.id];
		}
	}

	done();
}

export const TRIGGER_TYPES = [
	'congress_registration',
	'registration_entry'
];

// Generic trigger purpose
const triggerPurposeSchemaGeneric = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
			const: 'trigger'
		},
		triggerAmount: {
			type: 'object',
			nullable: true,
			properties: {
				amount: {
					type: 'integer',
					format: 'uint32'
				},
				currency: {
					type: 'string',
					enum: AKSOCurrency.all
				}
			},
			required: [
				'amount', 'currency'
			],
			additionalProperties: false
		},
		triggers: {
			type: 'string'
		},
		originalAmount: {
			type: 'integer',
			format: 'uint32',
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
		'triggers',
		'amount',
		'title'
	],
	additionalProperties: false
};

// Add triggers
const triggerPurposeSchema = TRIGGER_TYPES.map(triggerName => {
	let purpose = deepmerge({}, triggerPurposeSchemaGeneric);
	purpose.properties.triggers.const = triggerName;

	if (triggerName === 'congress_registration') {
		purpose.properties.dataId = {
			isBinary: true,
			minBytes: 12,
			maxBytes: 12
		};
		purpose.required.push('dataId');
	} else if (triggerName === 'registration_entry') {
		purpose.properties.registrationEntryId = {
			isBinary: true,
			minBytes: 15,
			maxBytes: 15
		};
		purpose.required.push('registrationEntryId');
	}

	return purpose;
});

export const purposeSchema = {
	oneOf: [
		...triggerPurposeSchema,
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
				originalAmount: {
					type: 'integer',
					format: 'uint32',
					nullable: true
				},
				amount: {
					type: 'integer',
					format: 'uint32'
				},
				description: {
					type: 'string',
					minLength: 1,
					maxLength: 255,
					nullable: true,
				},
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
				originalAmount: {
					type: 'integer',
					format: 'int32',
					nullable: true
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
				'title'
			],
			additionalProperties: false
		}
	]
};
