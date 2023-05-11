import SimpleResource from './simple-resource';

/**
 * A resource representing a ballot
 */
class BallotResource extends SimpleResource {
	constructor (obj) {
		super(obj);

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

export default BallotResource;
