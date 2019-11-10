export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const congress = await AKSO.db('congresses')
			.first('org')
			.where('id', req.params.congressId);
		if (!congress) { return res.sendStatus(404); }
		
		const orgPerm = 'congresses.delete.' + congress.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		await AKSO.db('congresses')
			.where('id', req.params.congressId)
			.delete();

		res.sendStatus(204);
	}
};
