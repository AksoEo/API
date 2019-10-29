import VoteResource from './vote-resource';

/**
 * A resource representing a codeholder vote
 */
class CodeholderVoteResource extends VoteResource {
	constructor (obj) {
		super(obj);

		if ('mayVote' in obj) { obj.mayVote = !!obj.mayVote; }
		if ('hasVoted' in obj) { obj.hasVoted = !!obj.hasVoted; }
		if ('percentageVoted' in obj && obj.percentageVoted !== null) { obj.percentageVoted = parseFloat(obj.percentageVoted, 10); }
	}
}

export default CodeholderVoteResource;
