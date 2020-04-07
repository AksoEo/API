export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		codeholderId: 'f',
		'customer.email': 'fs',
		'customer.name': 'fs',
		paymentMethodId: 'f',
		paymentMethod: '',
		org: '',
		currency: 'f',
		status: 'f',
		events: '',
		timeCreated: 'f',
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
		events: () => AKSO.db.raw('1')
	},
	alwaysSelect: [
		'id', 'paymentMethod', 'org'
	]
};

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].events) { return done(); }

	const eventsArr = await AKSO.db('pay_intents_events')
		.select('paymentIntentId', 'time', 'status')
		.whereIn('paymentIntentId', arr.map(row => row.id))
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

	done();
}

export const TRIGGER_TYPES = [ 'GARBAGE' ]; // TODO: Add triggers, remove GARBAGE
