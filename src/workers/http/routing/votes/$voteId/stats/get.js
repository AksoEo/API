export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('votes')
			.where('id', req.params.voteId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('votes.read.' + orgData.org)) { return res.sendStatus(403); }

		const numBallots = (await AKSO.db('votes_ballots')
			.first(AKSO.db.raw('COUNT(1) AS count'))
			.where('voteId', req.params.voteId)).count;

		const numVoters = (await AKSO.db('votes_voters')
			.first(AKSO.db.raw('COUNT(1) AS count'))
			.where({
				voteId: req.params.voteId,
				mayVote: true
			})).count;

		res.sendObj({
			numBallots,
			numVoters
		});
	}
};
