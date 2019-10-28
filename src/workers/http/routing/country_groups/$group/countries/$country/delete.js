export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'country_groups.update'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('countries_groups_members')
			.delete()
			.where({
				group_code: req.params.group,
				country_code: req.params.country
			});

		if (deleted) { res.sendStatus(204); }
		else { res.sendStatus(404); }
	}
};
