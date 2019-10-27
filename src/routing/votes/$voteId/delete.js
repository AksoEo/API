export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const vote = await AKSO.db('votes')
			.first('org')
			.where('id', req.params.voteId);
		if (!vote) { return res.sendStatus(404); }
		
		const orgPerm = 'votes.delete.' + vote.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		await AKSO.db('votes')
			.where('id', req.params.voteId)
			.delete();

		res.sendStatus(204);
	}
};
