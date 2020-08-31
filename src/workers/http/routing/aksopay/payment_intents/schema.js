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
		amountRefunded: 'f'
	},
	fieldAliases: {
		'customer.email': 'customer_email',
		'customer.name': 'customer_name',
		purposes: () => AKSO.db.raw('1'),
		events: () => AKSO.db.raw('1'),
		totalAmount: () => AKSO.db.raw('CAST((SELECT SUM(amount) from pay_intents_purposes where paymentIntentId = id) AS UNSIGNED INTEGER)')
	},
	alwaysSelect: [
		'id', 'paymentMethod', 'org'
	]
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
			} else if (purpose.type === 'manual') {
				purposeFormatted.title = purpose.title;
				purposeFormatted.description = purpose.description;
			} else if (purpose.type === 'trigger') {
				purposeFormatted.triggers = purpose.triggers;
				purposeFormatted.title = purpose.title;
				purposeFormatted.description = purpose.description;
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

export const TRIGGER_TYPES = [ 'GARBAGE' ]; // TODO: Add triggers, remove GARBAGE
