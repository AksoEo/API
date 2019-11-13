import QueryUtil from 'akso/lib/query-util';
import BallotResource from 'akso/lib/resources/ballot-resource';

import parSchema from './schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('votes_voters')
			.innerJoin('votes', 'votes_voters.voteId', 'votes.id')
			.leftJoin('votes_ballots', 'votes_voters.ballotId', 'votes_ballots.id')
			.where({
				'votes.id': req.params.voteId,
				codeholderId: req.user.user
			})
			.whereNotNull('timeVoted');
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new BallotResource(row, req, schema);
		res.sendObj(obj);
	}
};
