import QueryUtil from '../../../lib/query-util';

import { schema as codeholderSchema } from '../../../workers/http/routing/codeholders/schema';

export async function updateVoterCodeholdersOnTimeStart () {
	const votesToUpdate = await AKSO.db('votes')
		.select('id', 'viewerCodeholders', 'voterCodeholders')
		.limit(100)
		.whereRaw('NOT codeholdersSet AND timeStart < UNIX_TIMESTAMP()');

	for (const vote of votesToUpdate) {
		const quFilterOpts = {
			fields: Object.keys(codeholderSchema.fields)
				.filter(x => codeholderSchema.fields[x].indexOf('f' > -1)),
			fieldAliases: codeholderSchema.fieldAliases,
			customCompOps: codeholderSchema.customFilterCompOps,
			customLogicOps: codeholderSchema.customFilterLogicOps
		};

		// Insert all viewers
		const mayVoteQuery = AKSO.db('view_codeholders')
			.first(1)
			.whereRaw('id = codeholderId');
		QueryUtil.filter({
			...quFilterOpts,
			...{
				filter: vote.voterCodeholders,
				query: mayVoteQuery
			}
		});

		const viewerChQuery = AKSO.db('view_codeholders')
			.select(
				AKSO.db.raw('? AS voteId', vote.id),
				AKSO.db.raw('view_codeholders.id AS codeholderId'),
				AKSO.db.raw('COALESCE((?), 0) AS mayVote', mayVoteQuery),
			);
		const viewerFilter = { $or: [ vote.voterCodeholders ] };
		if (vote.viewerCodeholders) { viewerFilter.$or.push(vote.viewerCodeholders); }
		QueryUtil.filter({
			...quFilterOpts,
			...{
				filter: viewerFilter,
				query: viewerChQuery
			}
		});

		await AKSO.db(AKSO.db.raw('?? (??, ??, ??)', [
			'votes_voters',

			'voteId', 'codeholderId', 'mayVote'
		]))
			.insert(viewerChQuery);

		// Mark the vote as dealt with
		await AKSO.db('votes')
			.where('id', vote.id)
			.update('codeholdersSet', true);
	}
}
updateVoterCodeholdersOnTimeStart.intervalMs = 5000;
