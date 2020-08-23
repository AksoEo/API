export default {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		type: 'f',
		stripeMethods: '',
		name: 'fs',
		internalDescription: 's',
		description: 's',
		currencies: '',
		paymentValidity: '',
		isRecommended: 'f',
		feePercent:  '',
		'feeFixed.val': '',
		'feeFixed.cur': '',
		stripePublishableKey: ''
	},
	fieldAliases: {
		'feeFixed.val': 'feeFixed_val',
		'feeFixed.cur': 'feeFixed_cur'
	},
	alwaysSelect: [ 'type' ]
};
