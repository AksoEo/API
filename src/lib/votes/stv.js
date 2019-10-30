/*
	Copied from https://github.com/tejoesperanto/vocho-lib with changes 

	MIT License

	Copyright (c) 2019 Mia Nordentoft

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
 */

/**
 * Runs a TEJO Single Transferable Vote election
 * @param {number}          places              The number of electable candidates (seats)
 * @param {string[]|string} candidates          The candidates. Each candidate must be represented by one character
 * @param {string[]}        ballots             All ballots as e.g. `ABC` for A>B>C
 * @param {string[]}        [ignoredCandidates] Candidates excluded from this election
 * @param {string}          [tieBreaker]        A tie breaker listing all candidates
 * @returns {Object}
 */
export default function STV (places, candidates, ballots, ignoredCandidates = [], tieBreaker) {
	if (typeof candidates === 'string') { candidates = candidates.split(''); }
	places = Math.min(places, candidates.length); // We can't elect a ghost

	if (typeof tieBreaker !== 'undefined') {
		for (let cand of ignoredCandidates) {
			tieBreaker = tieBreaker.replace(cand, '');
		}
	}

	const originalBallots = [ ...ballots ];
	const weightedBallots = ballots.map(ballot => {
		return {
			weight: 1,
			prefs: ballot
		};
	});

	const quota = ballots.length / (places + 1); // Hagenbach-Bischoff

	// Validate the ballots
	for (let i in ballots) {
		for (let cand of ignoredCandidates) {
			ballots[i] = ballots[i].replace(cand, '');
		}
	}

	for (let cand of ignoredCandidates) {
		candidates.splice(candidates.indexOf(cand), 1);
	}

	const electedCandidates = [];
	// Determine the amount of votes each candidate has based on everyone's first preference
	const candidateVotes = {};
	for (let cand of candidates) { candidateVotes[cand] = 0; }
	for (let ballot of ballots) {
		const firstPref = ballot[0];
		candidateVotes[firstPref]++;
	}

	const roundStats = [];
	while (electedCandidates.length < places) {
		const roundStat = {
			elected: [],
			eliminated: null,
			votes: {}
		};
		roundStats.push(roundStat);

		const votesDebug = [];
		const exceedsQuota = [];
		for (let [cand, votes] of Object.entries(candidateVotes)) {
			roundStat.votes[cand] = votes;
			votesDebug.push(`${cand}: ${votes}`);
			if (votes > quota) { exceedsQuota.push(cand); }
		}
		electedCandidates.push(...exceedsQuota);
		roundStat.elected.push(...exceedsQuota);

		// § 3.7: Check if the amount of remaining candidates is equal to the amount of remaining places, and if so elect all remaining candidates
		if (places - electedCandidates.length === candidates.length) {
			// Elect all remaining candidates
			const justElected = candidates.filter(c => !electedCandidates.includes(c));
			electedCandidates.push(...justElected);
			roundStat.elected.push(...justElected);
			break;
		}

		// Transfer surplus votes
		// Calculate the surplus transfer value using the Gregory method
		for (let cand of exceedsQuota) {
			const votesReceived = candidateVotes[cand];

			// Find all ballots that listed the candidate as the first priority
			const firstPrefBallots = [];
			for (let ballot of weightedBallots) {
				if (ballot.prefs[0] !== cand) { continue; }
				firstPrefBallots.push(ballot);
			}
			const totalCandVoteValue = firstPrefBallots.map(b => b.weight).reduce((a, b) => a + b, 0);
			const transferValueFactor = (totalCandVoteValue - quota) / totalCandVoteValue;

			for (let ballot of firstPrefBallots) {
				// Change the value of each relevant ballot
				ballot.weight *= transferValueFactor;
			}

			// Remove elected candidates from the array of candidates
			candidates.splice(candidates.indexOf(cand), 1);
			delete candidateVotes[cand];

			// Remove all mentions of the candidate from ballots
			for (let ballot of weightedBallots) {
				ballot.prefs = ballot.prefs.replace(cand, '');
			}

			const transferTo = {};
			for (let ballot of firstPrefBallots) {
				// Count the second priorities of all relevant ballots
				const nextPref = ballot.prefs[0];
				if (!nextPref) { continue; } // Ignore the vote if there's no next priority
				if (!(nextPref in transferTo)) { transferTo[nextPref] = 1; }
				else { transferTo[nextPref]++; }
			}

			// Transfer the votes
			for (let [to, votes] of Object.entries(transferTo)) {
				const newVotes = (votesReceived - quota) / votesReceived * votes;
				candidateVotes[to] += newVotes;
			}
		}

		if (!exceedsQuota.length) { // No candidate elected, time to eliminate someone
			// § 3.11, eliminate the candidate with the least voices
			let minVotes = Number.MAX_SAFE_INTEGER;
			let minVotesCands = null;
			for (let [cand, votes] of Object.entries(candidateVotes)) {
				if (votes < minVotes) {
					minVotes = votes;
					minVotesCands = [ cand ];
				} else if (votes === minVotes) {
					minVotesCands.push(cand);
				}
			}

			let eliminatedCand;
			if (minVotesCands.length === 1) { // No tie
				eliminatedCand = minVotesCands[0];
			} else {
				// § 3.11 If multiple candidates have the same amount of votes, eliminate the one with the least first priorities,
				// then second priorities etc. in the ORIGINAL ballots.
				// If there is still equality, a tie breaker is needed, whose least preferred of the relevant candidates is to be eliminated

				let priorityNum = -1;
				while (priorityNum < candidates.length) {
					priorityNum++;

					let numPriorities = Number.MAX_SAFE_INTEGER;
					let numPrioritiesCands = null;
					for (let cand of minVotesCands) {
						// Find all ballots with the candidate at this priority level
						let candNumPriorities = 0;
						for (let ballot of originalBallots) {
							if (ballot[priorityNum] !== cand) { continue; }
							candNumPriorities++;
						}
						if (candNumPriorities < numPriorities) {
							numPriorities = candNumPriorities;
							numPrioritiesCands = [ cand ];
						} else {
							numPrioritiesCands.push(cand);
						}
					}

					if (numPrioritiesCands.length === 1) {
						minVotesCands = numPrioritiesCands;
					}
				}

				// Check if we've found a candidate to eliminate
				if (minVotesCands.length === 1) {
					eliminatedCand = minVotesCands[0];
				} else {
					// Nope, there's still equality. This calls for a tie breaker
					if (!tieBreaker) {
						const err = new Error('Tie breaker needed!');
						err.type = 'TIE_BREAKER_NEEDED';
						throw err;
					}
					// The least preferred candidate according to the tie breaker is eliminated
					const preferenceIndices = minVotesCands.map(cand => {
						return {
							cand: cand,
							index: tieBreaker.indexOf(cand)
						};
					});
					eliminatedCand = preferenceIndices
						.reduce((a, b) => {
							if (a.index > b.index) { return a; }
							return b;
						})
						.cand;
				}
			}

			// Transfer the voices of the eliminated candidate
			for (let ballot of weightedBallots) {
				// Find all ballots that have the eliminated candidate as their first priority
				if (ballot.prefs[0] !== eliminatedCand) { continue; }
				// Find their next preference
				const nextPref = ballot.prefs[1];
				if (!nextPref) { continue; } // Unless there is none
				candidateVotes[nextPref] += ballot.weight;
			}

			// Remove eliminated candidates from the array of candidates
			candidates.splice(candidates.indexOf(eliminatedCand), 1);
			delete candidateVotes[eliminatedCand];
			roundStat.eliminated = eliminatedCand;

			// Remove all mentions of the candidate from ballots
			for (let ballot of weightedBallots) {
				ballot.prefs = ballot.prefs.replace(eliminatedCand, '');
			}
		}
	}

	return {
		winners: electedCandidates,
		rounds: roundStats,
		quota: quota
	};
}
