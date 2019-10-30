import STV from '../../../../lib/votes/stv';
import RP from '../../../../lib/votes/rp';

const arrRange = (start, end) => Array.from({ length: (end - start + 1) }, (v, k) => k + start);
const CAND_SYMB = String.fromCharCode(
	// Basic Latin
	...arrRange(0x30, 0x39), // 0-9
	...arrRange(0x41, 0x5a), // A-Z
	...arrRange(0x61, 0x7a), // a-z

	// Latin-1 Supplement
	...arrRange(0xc0, 0xd6), // uppercase 1
	...arrRange(0xd8, 0xf6), // uppercase 2, lowercase 1
	...arrRange(0xf8, 0xff), // lowercase 2

	// Latin-2 Supplement
	...arrRange(0x100, 0x17f),

	// Latin Extended-B
	...arrRange(0x180, 0x182) // only the first three to reach exactly 255 symbols
);
function symbToOpt (symb) {
	return CAND_SYMB.indexOf(symb);
}
function optToSymb (opt) {
	return CAND_SYMB[opt];
}

function oneNumberOrFractionToFloat (str) {
	if (str.indexOf('/') === -1) { return parseFloat(str, 10); }
	const bits = str.split('/').map(x => parseInt(x, 10));
	return bits[0] / bits[1];
}

export async function determineVoteResults () {
	const votes = await AKSO.db('votes')
		.select('*')
		.whereRaw('NOT hasResults AND timeEnd <= UNIX_TIMESTAMP()');

	for (const vote of votes) {
		const result = await obtainVoteResult(vote);
		
		await AKSO.db('votes')
			.where('id', vote.id)
			.update('results', JSON.stringify(result));
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

	let ballots = (
		await AKSO.db('votes_ballots')
			.select('ballot')
			.where('voteId', vote.id)
	).map(x => x.ballot);
	if ([ 'rp', 'stv', 'tm' ].includes(vote.type)) {
		ballots = ballots
			.map(ballot => {
				ballot = ballot.split('\n')
					.filter(x => x); // remove empty rows
				if (vote.type === 'rp') {
					ballot = ballot
						.map(row => {
							return row
								.split(',')
								.filter(x => x) // remove empty cols
								.map(col => parseInt(col, 10));
						});
				} else {
					ballot = ballot.map(row => parseInt(row, 10));
				}
				return ballot;
			});
	}

	const result = {
		numVoters,
		numBallots: ballots.length
	};

	if (['yn','ynb'].includes(vote.type)) {
		result.tally = {
			y: ballots.filter(x => x === 'y').length,
			n: ballots.filter(x => x === 'n').length
		};
		if (vote.type === 'ynb') {
			result.tally.b = result.numBallots - result.tally.y - result.tally.n;
		}
	}

	// quorum
	const minVoters = oneNumberOrFractionToFloat(vote.quorum) * numVoters;
	const quorumOkay = vote.quorumInclusive ?
		result.numBallots >= minVoters :
		result.numBallots >  minVoters;
	if (!quorumOkay) {
		result.result = 'NO_QUORUM';
		return result;
	}

	// blankBallotsLimit
	if (vote.type !== 'yn') {
		result.numBlankBallots = 0;

		for (const ballot of ballots) {
			if (vote.type === 'ynb') {
				if (ballot === 'b') { result.numBlankBallots++; }
			} else {
				if (!ballot.length) { result.numBlankBallots++; }
			}
		}
		const maxBlankBallots = oneNumberOrFractionToFloat(vote.blankBallotsLimit) * result.numBallots;
		const blankBallotsOkay = vote.blankBallotsLimitInclusive ?
			result.numBlankBallots <= maxBlankBallots :
			result.numBlankBallots <  maxBlankBallots;
		if (!blankBallotsOkay) {
			result.result = 'TOO_MANY_BLANK_BALLOTS';
			return result;
		}
	}

	if (['yn', 'ynb'].includes(vote.type)) {
		// majorityBallots
		const minBallotsYes = oneNumberOrFractionToFloat(vote.majorityBallots) * result.numBallots;
		result.majorityBallotsOkay = vote.majorityBallotsInclusive ?
			result.tally.y >= minBallotsYes :
			result.tally.y >  minBallotsYes;

		// majorityVoters
		const minVotersYes = oneNumberOrFractionToFloat(vote.majorityVoters) * result.numVoters;
		result.majorityVotersOkay = vote.majorityVotersInclusive ?
			result.tally.y >= minVotersYes :
			result.tally.y > minVotersYes;

		const majorityOkay = vote.majorityMustReachBoth ?
			result.majorityBallotsOkay && result.majorityVotersOkay :
			result.majorityBallotsOkay || result.majorityVotersOkay;

		result.result = majorityOkay ?
			'MAJORITY' : 'NO_MAJORITY';
		return result;
	}

	// ONLY RP, STV and TM remaining

	let excluded; 
	if (['rp', 'tm'].includes(vote.type)) {
		// Tally opt mentions
		result.tally = {};
		for (let n = 0; n < vote.options.length; n++) {
			result.tally[n] = 0;
		}
		for (const ballot of ballots) {
			let optsMentioned = ballot;
			if (vote.type === 'rp') {
				optsMentioned = [].concat(...optsMentioned);
			}
			for (const opt of optsMentioned) {
				result.tally[opt]++;
			}
		}

		// mentionThreshold
		excluded = result.optsExcludedByMentionThreshold = [];
		const minOptMentions = oneNumberOrFractionToFloat(vote.mentionThreshold) * result.numBallots;
		for (let n = 0; n < vote.options.length; n++) {
			const mentionThresholdOkay = vote.mentionThresholdInclusive ?
				result.tally[n] >= minOptMentions :
				result.tally[n] >  minOptMentions;

			if (!mentionThresholdOkay) { excluded.push(n); }
		}
	}

	if (vote.type === 'tm') {
		// TM: Choose the `numChosenOptions` options with the most votes
		// If there's equality between options chosen and options not chosen, the vote is a tie

		const optsOrdered = result.optsOrdered = Object.entries(result.tally)
			.map(entry => {
				return {
					opt: parseInt(entry[0], 10),
					tally: entry[1]
				};
			})
			.filter(x => !excluded.includes(x.opt));
		optsOrdered.sort((a, b) => b.tally - a.tally);

		result.optsChosen = optsOrdered
			.slice(0, vote.numChosenOptions)
			.map(x => x.opt);

		// Check for equality
		result.optsEqual = [];
		const lowestChosenTally = result.tally[result.optsChosen[result.optsChosen.length - 1]];
		for (const opt of optsOrdered.slice(vote.numChosenOptions)) {
			if (opt.tally < lowestChosenTally) { break; }
			result.optsEqual.push(parseInt(opt.opt, 10));
		}

		if (result.optsEqual.length) {
			result.result = 'TIE';
		} else {
			result.result = 'CHOSEN';
		}

		return result;
	}

	// ONLY RP AND STV remaining

	const symbOpts = arrRange(0, vote.options.length - 1).map(optToSymb);
	let symbBallots = ballots
		.filter(x => x.length) // Disregard blank ballots
		.map(ballot => {
			if (vote.type === 'stv') {
				return ballot.map(optToSymb);
			} else { // rp
				return ballot.map(row => row.map(optToSymb));
			}
		});

	if (vote.type === 'stv') {
		symbBallots = symbBallots.map(x => x.join(''));

		let algResult;
		try {
			algResult = STV(vote.numChosenOptions, symbOpts, symbBallots);
		} catch (e) {
			if (e.type === 'TIE_BREAKER_NEEDED') {
				// TODO: Handle this better
				result.result = 'TIE_BREAKER_NEEDED';
				return result;
			}
			throw e;
		}

		result.electionQuota = algResult.quota;
		result.optsChosen = algResult.winners.map(symbToOpt);
		result.rounds = algResult.rounds.map(round => {
			const votes = {};
			for (const [symb, num] of Object.entries(round.votes)) {
				votes[symbToOpt(symb)] = num;
			}

			return {
				optsChosen: round.elected.map(symbToOpt),
				optEliminated: round.eliminated === null ? null : symbToOpt(round.eliminated),
				votes: votes
			};
		});

		return result;
	}

	// ONLY RP REMAINING

	if (vote.type === 'rp') {
		const algResults = [];

		const ignoredOpts = excluded.map(optToSymb);
		while (algResults.length < vote.numChosenOptions) {
			let algResult;
			try {
				algResult = RP(symbOpts, symbBallots, ignoredOpts);
				algResults.push(algResult);
			} catch (e) {
				if (e.type === 'TIE_BREAKER_NEEDED') {
					// TODO: Handle this better
					result.result = 'TIE_BREAKER_NEEDED';
					return result;
				}
				throw e;
			}
			ignoredOpts.push(algResult.winner);
		}

		result.optsChosen = algResults
			.map(x => symbToOpt(x.winner));

		result.rounds = algResults.map(round => {
			const candStats = {};
			for (const [candSymb, stats] of Object.entries(round.candStats)) {
				candStats[symbToOpt(candSymb)] = stats;
			}

			const graph = {};
			for (const [fromSymb, toSymbs] of Object.entries(round.graph)) {
				graph[symbToOpt(fromSymb)] = toSymbs.map(symbToOpt);
			}

			return {
				optChosen: symbToOpt(round.winner),
				rankedPairs: round.rankedPairs.map(pair => {
					const pairName = pair[0].split('');
					const pairData = pair[1];
					const pairObj = {
						pair: pairName.map(symbToOpt),
						diff: pairData.diff,
						winner: symbToOpt(pairData.winner),
						loser: symbToOpt(pairData.loser)
					};
					pairObj['opt' + symbToOpt(pairName[0])] = pairData[pairName[0]];
					pairObj['opt' + symbToOpt(pairName[1])] = pairData[pairName[1]];
					return pairObj;
				}),
				candStats: candStats,
				lock: round.lock.map(pair => pair.map(symbToOpt)),
				graph: graph
			};
		});

		return result;
	}
}
