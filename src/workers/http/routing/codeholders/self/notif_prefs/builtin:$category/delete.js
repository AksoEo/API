export default {
	schema: {
		query: null,
		body: null,
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('codeholders_notif_pref')
			.where({
				codeholderId: req.user.user,
				category: req.params.category,
			})
			.delete();
		
		res.sendStatus(deleted ? 204 : 404);
	}
};
