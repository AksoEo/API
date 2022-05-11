import QueryUtil from 'akso/lib/query-util';
import { insertAsInsertIgnore } from 'akso/util';

import { schema as codeholderSchema } from 'akso/workers/http/routing/codeholders/schema';

export async function updateVoterCodeholdersOnTimeStart () {
	const votesToUpdate = await AKSO.db('votes')
		.select('id', 'viewerCodeholders', 'voterCodeholders', 'viewerCodeholdersMemberFilter', 'voterCodeholdersMemberFilter', 'tieBreakerCodeholder')
		.limit(100)
		.whereRaw('NOT codeholdersSet AND timeStart < UNIX_TIMESTAMP()');

	for (const vote of votesToUpdate) {
		const quFilterOpts = {
			fields: codeholderSchema.fields,
			fieldAliases: codeholderSchema.fieldAliases,
			customCompOps: codeholderSchema.customFilterCompOps,
			customLogicOpsFields: codeholderSchema.customFilterLogicOpsFields,
			customLogicOps: codeholderSchema.customFilterLogicOps
		};

		// Insert all viewers
		const mayVoteQuery = AKSO.db('view_codeholders')
			.first(1)
			.whereRaw('id = codeholderId');
		const voterFilter = {
			$and: [
				vote.voterCodeholdersMemberFilter,
				vote.voterCodeholders
			]
		};
		QueryUtil.filter({
			...quFilterOpts,
			...{
				filter: voterFilter,
				query: mayVoteQuery
			}
		});

		const viewerChQuery = AKSO.db('view_codeholders')
			.select(
				AKSO.db.raw('? AS voteId', vote.id),
				AKSO.db.raw('view_codeholders.id AS codeholderId'),
				AKSO.db.raw('COALESCE((?), 0) AS mayVote', mayVoteQuery),
			);
		const viewerFilter = { $or: [ voterFilter ] };
		if (vote.viewerCodeholders) {
			viewerFilter.$or.push({
				$and: [
					vote.viewerCodeholdersMemberFilter,
					vote.viewerCodeholders
				]
			});
		}
		if (vote.tieBreakerCodeholder !== null) { viewerFilter.$or.push({ id: vote.tieBreakerCodeholder }); }
		QueryUtil.filter({
			...quFilterOpts,
			...{
				filter: viewerFilter,
				query: viewerChQuery
			}
		});

		await insertAsInsertIgnore(AKSO.db(AKSO.db.raw('?? (??, ??, ??)', [
			'votes_voters',

			'voteId', 'codeholderId', 'mayVote'
		]))
			.insert(viewerChQuery));

		// Mark the vote as dealt with
		await AKSO.db('votes')
			.where('id', vote.id)
			.update('codeholdersSet', true);
	}
}
updateVoterCodeholdersOnTimeStart.intervalMs = 5000;
