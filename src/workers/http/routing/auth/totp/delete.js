export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res, next) { // eslint-disable-line no-unused-vars
		if (!req.user || !req.user.isUser()) {
			return res.sendStatus(401);
		}

		if (!req.session.totp) { return res.sendStatus(404); }

		await AKSO.db('codeholders_totp').where('codeholderId', req.user.user).delete();
		await AKSO.db('codeholders_totp_remember').where('codeholderId', req.user.user).delete();

		req.session.totp = false;
		res.clearCookie('remember_totp');
		res.sendStatus(204);
	}
};
