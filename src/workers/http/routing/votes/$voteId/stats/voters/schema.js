export default {
	defaultFields: [ 'codeholderId' ],
	fields: {
		codeholderId: 'f',
		hasVoted: 'f',
		time: 'f',
		ballot: '',
	},
	fieldAliases: {
		time: 'timeVoted',
		hasVoted: () => AKSO.db.raw('timeVoted IS NOT NULL'),
		ballot: () => AKSO.db.raw('IF(timeEnd > UNIX_TIMESTAMP() OR ballotsSecret,NULL,ballot)'),
	},
	alwaysSelect: [ 'type' ],
};