export default {
	schema: {},

	run: async function run (req, res) {
		const deleted = await AKSO.db('newsletters_subscribers')
			.where({
				codeholderId: req.user.user,
				id: req.params.newsletterId,
			})
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
