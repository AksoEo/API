export default {
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		org: 'f',
		name: 's',
		description: '',
		useCount: 'f'
	},
	fieldAliases: {
		useCount: () => AKSO.db.raw(
			'(SELECT COUNT(1) FROM codeholders_delegations_subjects cs' +
			' WHERE cs.subjectId = delegations_subjects.id)'
		)
	}
};
