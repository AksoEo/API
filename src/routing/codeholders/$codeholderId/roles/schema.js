export default {
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'durationFrom': 'f',
		'durationTo': 'f',
		'isActive': 'f',
		'role.id': 'f',
		'role.name': 'fs',
		'role.description': 'fs'
	},
	fieldAliases: {
		'id': 'codeholderRoles_codeholders.id',
		'isActive': () => AKSO.db.raw(`
			(
				durationFrom IS NULL
				OR durationFrom <= UNIX_TIMESTAMP()
			)
			and
			(
				durationTo IS NULL
				OR durationTO > UNIX_TIMESTAMP()
			)
		`),
		'role.id': 'roleId',
		'role.name': 'codeholderRoles.name',
		'role.description': 'codeholderRoles.description'
	}
};
