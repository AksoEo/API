export default {
	schema: {
		query: null,
		body: null,
	},

	run: async function run (req, res) {
		const newsletter = await AKSO.db('newsletters')
			.first('org')
			.where('id', req.params.newsletterId);
		if (!newsletter) { return res.sendStatus(404); }
		
		const orgPerm = 'newsletters.' + newsletter.org + '.delete';
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		await AKSO.db('newsletters')
			.where('id', req.params.newsletterId)
			.delete();

		res.sendStatus(204);
	}
};
