export default {
	defaultFields: [ 'form' ],
	fields: {
		allowUse: '',
		allowGuests: '',
		editable: '',
		cancellable: '',
		manualApproval: '',
		'price.currency': '',
		'price.var': '',
		'price.minUpfront': '',
		form: ''
	},
	fieldAliases: {
		'price.currency': 'price_currency',
		'price.var': 'price_var',
		'price.minUpfront': 'price_minUpfront'
	}
};
