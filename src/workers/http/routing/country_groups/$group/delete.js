export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'country_groups.delete'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('countries_groups')
			.delete()
			.where('code', req.params.group);

		if (deleted) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
