import moment from 'moment-timezone';

export async function deleteExpiredLogs () {
	await AKSO.db('httpLog')
		.where('time', '<', moment().unix() - AKSO.LOG_DELETION_TIME)
		.delete();

	await AKSO.db('codeholders_logins')
		.where('time', '<', moment().unix() - AKSO.LOG_DELETION_TIME)
		.delete();
}
deleteExpiredLogs.intervalMs = 43200000; // 12 hours
deleteExpiredLogs.disregardExecutionTime = true;

export async function deleteCodeholderHist () {
	const tables = await AKSO.db.raw('show tables like "codeholders_hist_%"')
		.then(tablesRaw => tablesRaw[0].map(x => x[Object.keys(x)[0]]));
	
	const deltaTime = moment().unix() - AKSO.CODEHOLDER_HIST_DELETION_TIME;
	for (const table of tables) {
		await AKSO.db.raw('DELETE FROM ?? WHERE modTime < ?', [ table, deltaTime ]);
	}
}
deleteCodeholderHist.intervalMs = 43200000; // 12 hours
deleteCodeholderHist.disregardExecutionTime = true;
