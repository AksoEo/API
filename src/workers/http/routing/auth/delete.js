export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res, next) { // eslint-disable-line no-unused-vars
		if (req.user && req.user.isUser()) {
			await req.logOut({ keepSessionInfo: false });
			res.clearCookie('remember_totp', { path: '/' });
			res.sendStatus(204);
		} else {
			res.sendStatus(404);
		}
	}
};
