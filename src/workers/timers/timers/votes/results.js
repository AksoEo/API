import { runMappedConfigVote, VoteStatus } from '@tejo/akso-voting';
import { sendNotification } from 'akso/notif';
import { replaceObject } from 'akso/util';

export async function determineVoteResults () {
	const votes = await AKSO.db('votes')
		.select('*')
		.whereRaw('NOT hasResults AND timeEnd <= UNIX_TIMESTAMP()');

	for (const vote of votes) {
		const result = await obtainVoteResult(vote);
		
		await AKSO.db('votes')
			.where('id', vote.id)
			.update('results', JSON.stringify(
				replaceObject(result, obj => {
					if (obj instanceof Map) {
						return Object.fromEntries(obj);
					}
					return obj;
				})
			));
	}
}
determineVoteResults.intervalMs = 5000;

async function obtainVoteResult (vote) {
	const numVoters = (
		await AKSO.db('votes_voters')
			.first(AKSO.db.raw('COUNT(1) as count'))
			.where({
				voteId: vote.id,
				mayVote: true
			})
	).count;

	let candidates;
	let ballots = await AKSO.db('votes_ballots')
		.select('ballot')
		.where('voteId', vote.id)
		.pluck('ballot');
	if ([ 'rp', 'stv', 'tm' ].includes(vote.type)) {
		candidates = [...vote.options.keys()];
		if (vote.type === 'tm') {
			ballots = ballots.map(ballot => {
				return ballot.split('=')
					.filter(x => x) // remove empty rows
					.map(x => parseInt(x, 10));
			});
		} else { // rp, stv
			ballots = ballots.map(ballot => {
				ballot = ballot.split('>')
					.filter(x => x); // remove empty rows
				if (vote.type === 'rp') {
					ballot = ballot
						.map(row => {
							return row
								.split('=')
								.filter(x => x) // remove empty cols
								.map(col => parseInt(col, 10));
						});
				} else {
					ballot = ballot.map(row => parseInt(row, 10));
				}
				return ballot;
			});
		}
	} else if ([ 'yn', 'ynb' ].includes(vote.type)) {
		candidates = ['y','n'];
		ballots = ballots.map(ballot => {
			if (ballot === 'b') { return []; }
			return [ballot];
		});
	}

	let tieBreakerBallot = undefined;
	if (vote.tieBreakerBallot) {
		tieBreakerBallot = vote.tieBreakerBallot.split('>').map(x => parseInt(x, 10));
	}

	const result = runMappedConfigVote(vote, ballots, numVoters, candidates, tieBreakerBallot);
	
	if (result.status === VoteStatus.TieBreakerNeeded) {
		await sendNotification({
			org: vote.org,
			notif: 'tie-breaker-needed',
			codeholderIds: [ vote.tieBreakerCodeholder ],
			category: 'vote',
			view: {
				vote: vote.id,
			},
		});
	}

	return result;
}
