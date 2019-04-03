export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res, next) {
		if (req.user && req.user.isUser()) {
			const totpData = await AKSO.db.first(1).from('codeholders_totp').where('codeholderId', req.user.user);

			const totpSetUp = !!totpData;
			const totpUsed = !!req.session.totp;

			res.sendObj({
				csrfToken: req.csrfToken ? req.csrfToken() : null, // return null if CSRF is disabled
				totpSetUp: totpSetUp,
				totpUsed: totpUsed,
				isAdmin: null // todo
			});
		} else {
			res.sendStatus(404);
		}
	}
};
