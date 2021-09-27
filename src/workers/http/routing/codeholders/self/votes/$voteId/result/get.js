export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const voteData = await AKSO.db('votes_voters')
			.innerJoin('votes', 'voteId', 'id')
			.first('results')
			.where({
				codeholderId: req.user.user,
				voteId: req.params.voteId,
				hasResults: true
			});

		if (!voteData) { return res.sendStatus(404); }

		res.sendObj(voteData.results);
	}
};
