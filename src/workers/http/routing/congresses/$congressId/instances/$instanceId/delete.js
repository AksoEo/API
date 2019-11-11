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
		
		const orgPerm = 'congress_instances.delete.' + congress.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		const deleted = await AKSO.db('congresses_instances')
			.where({
				congressId: req.params.congressId,
				id: req.params.instanceId
			})
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
