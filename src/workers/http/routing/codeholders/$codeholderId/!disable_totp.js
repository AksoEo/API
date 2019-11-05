export default {
	schema: {
		body: null,
		query: null,
		requirePerms: 'codeholders.disable_totp'
	},

	run: async function run (req, res) {
		const deleted = await AKSO.db('codeholders_totp')
			.where('codeholderId', req.params.codeholderId)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};
