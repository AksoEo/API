export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res) {
		const magazine = await AKSO.db('magazines')
			.first('org')
			.where('id', req.params.magazineId);
		if (!magazine) { return res.sendStatus(404); }
		
		const orgPerm = 'magazines.delete.' + magazine.org;
		if (!req.hasPermission(orgPerm)) { return res.sendStatus(403); }

		await AKSO.db('magazines')
			.where('id', req.params.magazineId)
			.delete();

		res.sendStatus(204);
	}
};
