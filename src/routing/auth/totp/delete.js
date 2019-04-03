export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res, next) {
		if (!req.user || !req.user.isUser()) {
			return res.sendStatus(401);
		}

		if (!req.session.totp) { return res.sendStatus(404); }

		await AKSO.db('codeholders_totp').where('codeholderId', req.user.user).delete();

		req.session.totp = false;
		res.sendStatus(204);
	}
};
