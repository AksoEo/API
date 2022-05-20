export const schema = {
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'org': 'f',
		'name': 'fs',
		'description': 's',
		'public': 'f',
		'numSubscribers': '',
	},
	fieldAliases: {
		'numSubscribers': () =>
			AKSO.db.raw('SELECT COUNT(1) FROM newsletters_subscribers WHERE newsletters_subscribers.newsletterId = newsletters.id'),
	}
};
