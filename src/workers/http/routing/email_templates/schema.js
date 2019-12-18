export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		base: 'f',
		org: 'f',
		name: 'fs',
		description: 's',
		intent: 'f',
		script: '',
		subject: 'fs',
		from: 'f',
		fromName: 'f',
		replyTo: '',
		html: '',
		text: '',
		modules: ''
	},
	alwaysSelect: [ 'base' ]
};

export const domains = {
	tejo: [ 'tejo.org' ],
	uea: [ 'uea.org', 'co.uea.org' ]
};
