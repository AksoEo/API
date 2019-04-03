export default {
	schema: {
		query: null,
		body: null
	},

	run: async function run (req, res, next) {
		if (req.user && req.user.isUser()) {
			res.sendObj({
				csrfToken: req.csrfToken(),
				totpSetUp: null, // todo
				totpUsed: null, // todo
				isAdmin: null // todo
			});
		} else {
			res.sendStatus(404);
		}
	}
};
