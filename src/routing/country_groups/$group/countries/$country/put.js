export default {
	schema: {
		query: null,
		body: null,
		requirePerms: 'country_groups.update'
	},

	run: async function run (req, res) {
		const alreadyInserted = await AKSO.db.raw(
			`select
			exists(select 1 from countries_groups_members where group_code = :group and country_code = :country)
			as \`exists\``,

			{ group: req.params.group, country: req.params.country }
		);

		if (alreadyInserted[0][0].exists) { return res.sendStatus(204); }

		const exists = await AKSO.db.raw(
			`select
			exists(select 1 from countries_groups where code = :group) and
			exists(select 1 from countries where code = :country)
			as \`exists\``,

			{ group: req.params.group, country: req.params.country }
		);

		// knex returns a double array for some reason
		if (!exists[0][0].exists) { return res.sendStatus(404); }

		await AKSO.db('countries_groups_members').insert({
			group_code: req.params.group,
			country_code: req.params.country
		});

		res.sendStatus(204);
	}
};
