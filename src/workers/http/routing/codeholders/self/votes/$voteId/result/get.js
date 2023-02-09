export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const voteData = await AKSO.db('votes')
			.first('results')
			.innerJoin('votes_voters', 'votes_voters.voteId', 'votes.id')
			.where({
				codeholderId: req.user.user,
				voteId: req.params.voteId,
				hasResults: true,
				publishResults: true,
			});

		if (!voteData) { return res.sendStatus(404); }
		res.sendObj(voteData.results);
	}
};
