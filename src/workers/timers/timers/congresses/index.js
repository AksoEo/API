import { assignSequenceIdIfNeeded } from 'akso/workers/http/routing/congresses/$congressId/instances/$instanceId/participants/schema';

export async function assignSequenceIds () {
	const needSequenceIdArr = await AKSO.db('view_congresses_instances_participants')
		.select('dataId', 'view_congresses_instances_participants.congressInstanceId')
		.innerJoin('congresses_instances_registrationForm',
			'congresses_instances_registrationForm.congressInstanceId',
			'view_congresses_instances_participants.congressInstanceId')
		.whereNull('sequenceId')
		.whereNotNull('sequenceIds_startAt')
		.whereRaw('isValid OR NOT sequenceIds_requireValid');

	for (const needSequenceId of needSequenceIdArr) {
		await assignSequenceIdIfNeeded(needSequenceId.congressInstanceId, needSequenceId.dataId);
	}
}
assignSequenceIds.intervalMs = 60000; // 1 minute