export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const voteData = await AKSO.db('votes')
			.where({
				id: req.params.voteId,
				hasResults: true,
			})
			.first('org', 'results');
		if (!voteData) { return res.sendStatus(404); }
		if (!req.hasPermission('votes.read.' + voteData.org)) { return res.sendStatus(403); }

		res.sendObj(voteData.results);
	}
};
