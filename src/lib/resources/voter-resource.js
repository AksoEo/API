import BallotResource from './ballot-resource';

/**
 * A resource representing a voter
 */
class VoterResource extends BallotResource {
	constructor (obj) {
		super(obj);

		if ('hasVoted' in obj) { obj.hasVoted = !!obj.hasVoted; }
	}
}

export default VoterResource;
