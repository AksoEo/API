/*
	Copied from vocho-lib with changes 

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

// https://hackernoon.com/the-javascript-developers-guide-to-graphs-and-detecting-cycles-in-them-96f4f619d563
function isCyclic (graph) {
	const nodes = Object.keys(graph);
	const visited = {};
	const recStack = {};

	const _isCyclic = (node, visited, recStack) => {
		if (!visited[node]) {
			visited[node] = true;
			recStack[node] = true;
			const nodeNeighbors = graph[node];
			for (let currentNode of nodeNeighbors) {
				if (
					(!visited[currentNode] && _isCyclic(currentNode, visited, recStack)) ||
					recStack[currentNode]
				) { return true; }
			}
		}
		recStack[node] = false;
		return false;
	};

	for (let node of nodes) {
		if (_isCyclic(node, visited, recStack)) {
			return true;
		}
	}
	return false;
}

/**
 * Runs a tideman ranked pairs election
 * @param {string[]|string} candidates          The candidates. Each candidate must be represented by one character
 * @param {string[][][]}    ballots             All ballots in array form
 * @param {string[]}        [ignoredCandidates] An array of candidates to ignore
 * @param {string[]}        [tieBreaker]        The fully inclusive tie breaker ballot without any equals
 * @return {Object}
 */
export default function RankedPairs (candidates, ballots, ignoredCandidates = [], tieBreaker) {
	if (typeof candidates === 'string') { candidates = candidates.split(''); }
	candidates.sort();

	// Create pairs
	const pairs = {};
	for (let i = 0; i < candidates.length; i++) {
		const cand1 = candidates[i];
		for (let n = i + 1; n < candidates.length; n++) {
			const cand2 = candidates[n];
			const pairName = cand1 + cand2;
			const pair = pairs[pairName] = {
				diff: 0,
				winner: null,
				loser: null
			};
			pair[cand1] = 0;
			pair[cand2] = 0;
		}
	}

	// Tally
	const candStats = {};
	for (let cand of candidates) {
		candStats[cand] = {
			won: 0,
			lost: 0,
			mentions: 0
		};
	}

	for (const ballot of ballots) {
		const alreadyMentioned = [];
		for (const curRow of ballot) {
			for (let curCol of curRow) {
				alreadyMentioned.push(curCol);
				candStats[curCol].mentions++;
			}
		}

		// Consider candidates not mentioned as lesser than those mentioned
		ballot.push(candidates.filter(x => !alreadyMentioned.includes(x)));

		for (let y = 0; y < ballot.length; y++) {
			const curRow = ballot[y];
			for (let curCol of curRow) {
				for (let i = y + 1; i < ballot.length; i++) {
					const lesserRow = ballot[i];

					for (let lesserCol of lesserRow) {
						const pairName = [ curCol, lesserCol ].sort().join('');
						pairs[pairName][curCol]++;
					}
				}
			}
		}
	}

	// Disqualify candidates as needed
	for (let cand in candStats) {
		if (ignoredCandidates.includes(cand)) {
			candidates.splice(candidates.indexOf(cand), 1);

			for (let pairName in pairs) {
				const cands = pairName.split('');
				if (cands.includes(cand)) {
					delete pairs[pairName];
				}
			}
		}
	}

	// Determine the results of the compared pairs
	for (let [pairName, pair] of Object.entries(pairs)) {
		const [cand1, cand2] = pairName.split('');
		pair.diff = pair[cand1] - pair[cand2];

		if (pair[cand1] > pair[cand2]) {
			candStats[cand1].won++;
			candStats[cand2].lost++;
			pair.winner = cand1;
			pair.loser = cand2;
		} else if (pair[cand2] > pair[cand1]) {
			candStats[cand2].won++;
			candStats[cand1].lost++;
			pair.winner = cand2;
			pair.loser = cand1;
		} else {
			if (!tieBreaker) {
				const err = new Error('Tie breaker needed!');
				err.type = 'TIE_BREAKER_NEEDED';
				throw err;
			}

			const cand1Index = tieBreaker.indexOf(cand1);
			const cand2Index = tieBreaker.indexOf(cand2);

			if (cand1Index < cand2Index) {
				candStats[cand1].won++;
				candStats[cand2].lost++;
				pair.winner = cand1;
				pair.loser = cand2;
			} else {
				candStats[cand2].won++;
				candStats[cand1].lost++;
				pair.winner = cand2;
				pair.loser = cand1;
			}
		}
	}

	// Order the pairs
	const orderedEntries = [];
	const entries = Object.entries(pairs);
	while (entries.length) {
		let maxDiff = -1;
		let maxDiffIndices = null;
		for (let i = 0; i < entries.length; i++) {
			const pair = entries[i];
			const absDiff = Math.abs(pair[1].diff);
			if (absDiff > maxDiff) {
				maxDiff = absDiff;
				maxDiffIndices = [ i ];
			} else if (absDiff === maxDiff) {
				maxDiffIndices.push(i);
			}
		}

		if (maxDiffIndices.length === 1) {
			// No tie
			const pair = entries.splice(maxDiffIndices[0], 1)[0];
			orderedEntries.push(pair);
		} else {
			// We have a tie, follow §2.10
			// Obtain the pairs, from the highest index to the lowest as to not mess up the indices when removing them
			maxDiffIndices.sort((a, b) => b - a);
			const equalPairs = maxDiffIndices.map(i => entries.splice(i, 1)[0]);

			// 1. The pair with a loser that's already listed as a loser is put first
			const loserEntries = []; // All losers that are already in the ordered pairs
			for (let i = 0; i < equalPairs.length; i++) {
				const equalPair = equalPairs[i];
				// Find the loser of the equal pair
				const equalPairLoser = equalPair[1].loser;

				// Check if the loser is already in the ordered pairs as a loser
				let hasOrderedLoser = false;
				let orderedIndex;
				for (orderedIndex = 0; orderedIndex < orderedEntries.length; orderedIndex++) {
					const orderedEntry = orderedEntries[orderedIndex];
					const orderedLoser = orderedEntry[1].loser;
					if (equalPairLoser === orderedLoser) {
						hasOrderedLoser = true;
						break;
					}
				}
				if (hasOrderedLoser) { loserEntries.push({ eqI: i, or: orderedIndex }); }
			}
			loserEntries.sort((a, b) => b.or - a.or); // Don't mess up the indices when splicing

			const newOrderedLoserEntries = [];
			for (let i = 0; i < loserEntries.length; i++) {
				const loserEntry = loserEntries[i];
				const nextLoserEntry = loserEntries[i + 1];
				if (typeof nextLoserEntry === 'undefined' || nextLoserEntry.or > loserEntry.or) {
					newOrderedLoserEntries.push(loserEntry.eqI);
				}
			}
			newOrderedLoserEntries.sort((a, b) => b - a); // Don't mess up the indices when splicing
			for (let i of newOrderedLoserEntries) {
				orderedEntries.push(equalPairs.splice(i, 1)[0]);
			}

			// 2. The pair with a winner that's already listed as a winner is put first
			const winnerEntries = []; // All winners that are already in the ordered pairs
			for (let i = 0; i < equalPairs.length; i++) {
				const equalPair = equalPairs[i];
				// Find the winner of the equal pair
				const equalPairWinner = equalPair[1].winner;

				// Check if the winner is already in the ordered pairs as a winner
				let hasOrderedWinner = false;
				let orderedIndex;
				for (orderedIndex = 0; orderedIndex < orderedEntries.length; orderedIndex++) {
					const orderedEntry = orderedEntries[orderedIndex];
					const orderedWinner = orderedEntry[1].winner;
					if (equalPairWinner === orderedWinner) {
						hasOrderedWinner = true;
						break;
					}
				}
				if (hasOrderedWinner) { winnerEntries.push({ eqI: i, or: orderedIndex }); }
			}
			winnerEntries.sort((a, b) => b.or - a.or); // Don't mess up the indices when splicing

			const newOrderedWinnerEntries = [];
			for (let i = 0; i < winnerEntries.length; i++) {
				const winnerEntry = winnerEntries[i];
				const nextWinnerEntry = winnerEntries[i + 1];
				if (typeof nextWinnerEntry === 'undefined' || nextWinnerEntry.or > winnerEntry.or) {
					newOrderedWinnerEntries.push(winnerEntry.eqI);
				}
			}
			newOrderedWinnerEntries.sort((a, b) => b - a); // Don't mess up the indices when splicing
			for (let i of newOrderedWinnerEntries) {
				orderedEntries.push(equalPairs.splice(i, 1)[0]);
			}

			if (equalPairs.length > 1) {
				// 3. The pair with a loser that is least preferred by the tie breaker ballot is put first
				if (!tieBreaker) {
					const err = new Error('Tie breaker needed!');
					err.type = 'TIE_BREAKER_NEEDED';
					throw err;
				}

				const loserPrefIndices = equalPairs.map((equalPairEntry, i) => {
					const loser = equalPairEntry[1].loser;
					return { eqI: i, or: tieBreaker.indexOf(loser) };
				});

				const newOrderedTieBreakerPairs = [];
				for (let i = 0; i < loserPrefIndices.length; i++) {
					const pair = loserPrefIndices[i];
					const nextPair = loserPrefIndices[i + 1];
					if (typeof nextPair === 'undefined' || nextPair.or > pair.or) {
						newOrderedTieBreakerPairs.push(pair.eqI);
					}
				}
				newOrderedTieBreakerPairs.sort((a, b) => b - a); // Don't mess up the indices when splicing
				for (let i of newOrderedTieBreakerPairs) {
					orderedEntries.push(equalPairs.splice(i, 1)[0]);
				}
			}

			// There should only be one pair remaining at this point
			orderedEntries.push(...equalPairs);
		}
	}

	// Make a graph of the winning pairs
	let lock = {};
	for (let cand of candidates) {
		lock[cand] = [];
	}
	const lockEntries = [];

	for (let entry of orderedEntries) {
		const pair = entry[1];
		const from = pair.winner;
		const to = pair.loser;

		lock[from].push(to);
		if (isCyclic(lock)) {
			lock[from].pop();
			continue;
		}

		lockEntries.push([ from, to ]);
	}

	// Find the candidate at the root of the graph (with nothing pointing to it)
	const possibleWinners = [...candidates];
	const candsPointedTo = new Set([].concat(...Object.values(lock)));
	for (let cand of candsPointedTo) {
		possibleWinners.splice(possibleWinners.indexOf(cand), 1);
	}
	const winner = possibleWinners[0];

	return {
		winner: winner,
		compPairs: pairs,
		rankedPairs: orderedEntries,
		candStats: candStats,
		lock: lockEntries,
		graph: lock
	};
}
