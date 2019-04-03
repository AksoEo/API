import passport from 'passport';

export default {
	schema: {
		query: null,
		body: {
			properties: {
				login: {
					type: 'string',
					oneOf: [
						{
							format: 'email'
						},
						{
							pattern: '^[a-z]{4}([a-z]{2})?$'
						}
					]
				},
				password: {
					type: 'string'
				}
			},
			additionalProperties: false,
			required: [
				'login',
				'password'
			]
		}
	},

	run: async function run (req, res, next) {
		passport.authenticate('local', (err, user, info) => {
			if (err) { return next(err); }
			if (!user) { return res.sendStatus(401); }
			req.logIn(user, err => {
				if (err) { return next(err); }

				res.sendStatus(204);
			});
		})(req, res, next);
	}
};
