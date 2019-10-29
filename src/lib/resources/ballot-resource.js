import SimpleResource from './simple-resource';

/**
 * A resource representing a ballot
 */
class BallotResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if (obj.ballot) {
			if (['stv','tm','rp'].includes(obj.type)) {
				obj.ballot = obj.ballot.split('\n');

				if (obj.type === 'rp') {
					obj.ballot = obj.ballot.map(row => row.split(',').map(col => parseInt(col, 10)));
				} else {
					obj.ballot = obj.ballot.map(col => parseInt(col, 10));
				}
			}
		}

		delete obj.type;
	}
}

export default BallotResource;
