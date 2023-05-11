import BallotResource from './ballot-resource';

/**
 * A resource representing a voter
 */
class VoterResource extends BallotResource {
	constructor (obj) {
		super(obj);

		if ('hasVoted' in obj) { obj.hasVoted = !!obj.hasVoted; }
		if (obj.ballot && !['yn', 'ynb'].includes(obj.type)) {
			obj.ballot = obj.ballot.split('>');
			if (obj.type === 'rp') {
				obj.ballot = obj.ballot.map(x => x.split('=').map(y => parseInt(y, 10)));
			} else {
				obj.ballot = obj.ballot.map(x => parseInt(x, 10));
			}
		}

		delete obj.type;
	}
}

export default VoterResource;
