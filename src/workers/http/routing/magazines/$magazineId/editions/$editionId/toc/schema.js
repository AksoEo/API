export default {
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'page': 'f',
		'title': 'fs',
		'author': 'fs',
		'recitationAuthor': 'fs',
		'text': 's',
		'highlighted': 'f',
		'availableRecitationFormats': ''
	},
	fieldAliases: {
		availableRecitationFormats: () =>
			AKSO.db.raw('(select group_concat(format) from magazines_editions_toc_recitations where magazines_editions_toc_recitations.tocEntryId = magazines_editions_toc.id)')
	}
};
