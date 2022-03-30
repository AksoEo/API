export default {
	defaultFields: [ 'id' ],
	fields: {
		'id': 'f',
		'durationFrom': 'f',
		'durationTo': 'f',
		'isActive': 'f',
		'role.id': 'f',
		'role.name': 'fs',
		'role.description': 'fs',
		'role.public': 'f',
		'dataCountry': 'f',
		'dataOrg': 'f',
		'dataString': ''
	},
	fieldAliases: {
		'id': 'codeholderRoles_codeholders.id',
		'isActive': () => AKSO.db.raw(`
			(
				durationFrom IS NULL
				OR durationFrom <= UNIX_TIMESTAMP()
			)
			AND
			(
				durationTo IS NULL
				OR durationTO > UNIX_TIMESTAMP()
			)
		`),
		'role.id': 'roleId',
		'role.name': 'codeholderRoles.name',
		'role.description': 'codeholderRoles.description',
		'role.public': 'codeholderRoles.public',
	}
};
