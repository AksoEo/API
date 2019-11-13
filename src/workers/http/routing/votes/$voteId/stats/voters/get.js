import QueryUtil from 'akso/lib/query-util';
import VoterResource from 'akso/lib/resources/voter-resource';

import parSchema  from './schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'codeholders.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const voteData = await AKSO.db('votes')
			.first('org', 'publishVoters')
			.where('id', req.params.voteId);
		if (!voteData) { return res.sendStatus(404); }
		if (!req.hasPermission('votes.read.' + voteData.org)) { return res.sendStatus(403); }
		if (!voteData.publishVoters) { return res.sendStatus(409); }

		const query = AKSO.db('votes_voters')
			.innerJoin('votes', 'votes_voters.voteId', 'votes.id')
			.leftJoin('votes_ballots', 'ballotId', 'votes_ballots.id')
			.where('votes_voters.voteId', req.params.voteId);
		await QueryUtil.handleCollection({ req, res, schema, query, Res: VoterResource });
	}
};
