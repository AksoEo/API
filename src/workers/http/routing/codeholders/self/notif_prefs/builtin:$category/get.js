export default {
	schema: {
		query: null,
		body: null,
	},

	run: async function run (req, res) {
		const pref = await AKSO.db('codeholders_notif_pref')
			.first('pref')
			.where({
				codeholderId: req.user.user,
				category: req.params.category,
			});
		if (!pref) {
			return res.sendStatus(404);
		}

		res.sendObj({
			pref: pref.pref.split(','),
		});
	}
};
