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
