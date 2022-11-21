export const schema = {
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
		customFormVars: '',
	},
	fieldAliases: {
		'price.currency': 'price_currency',
		'price.var': 'price_var',
		'price.minUpfront': 'price_minUpfront',
		'sequenceIds.startAt': 'sequenceIds_startAt',
		'sequenceIds.requireValid': 'sequenceIds_requireValid',
		customFormVars: () => AKSO.db.raw('1'),
	},
	alwaysSelect: [ 'congressInstanceId' ],
};

export async function afterQuery (arr, done) {
	if (!arr.length || !arr[0].customFormVars) { return done(); }

	const customFormVars = await AKSO.db('congresses_instances_registrationForm_customFormVars')
		.select('congressInstanceId', 'name', 'type', 'default')
		.whereIn('congressInstanceId', arr.map(x => x.congressInstanceId));
	const customFormVarsMap = {};
	for (const customFormVar of customFormVars) {
		if (!(customFormVar.congressInstanceId in customFormVarsMap)) {
			customFormVarsMap[customFormVar.congressInstanceId] = {};
		}
		customFormVarsMap[customFormVar.congressInstanceId][customFormVar.name] = {
			type: customFormVar.type,
			default: customFormVar.default,
		};
	}

	for (const row of arr) {
		row.customFormVars = customFormVarsMap[row.congressInstanceId];
	}

	done();
}
