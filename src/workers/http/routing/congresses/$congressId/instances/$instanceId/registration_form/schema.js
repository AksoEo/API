export default {
	defaultFields: [ 'form' ],
	fields: {
		allowUse: '',
		allowGuests: '',
		editable: '',
		cancellable: '',
		manualApproval: '',
		'sequenceIds.startAt': '',
		'sequenceIds.requireValid': '',
		'price.currency': '',
		'price.var': '',
		'price.minUpfront': '',
		form: '',
		identifierName: '',
		identifierEmail: '',
		identifierCountryCode: '',
		confirmationNotifTemplateId: '',
	},
	fieldAliases: {
		'price.currency': 'price_currency',
		'price.var': 'price_var',
		'price.minUpfront': 'price_minUpfront',
		'sequenceIds.startAt': 'sequenceIds_startAt',
		'sequenceIds.requireValid': 'sequenceIds_requireValid'
	}
};
