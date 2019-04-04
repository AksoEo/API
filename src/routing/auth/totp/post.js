import crypto from 'pn/crypto';
import passport from 'passport';

export default {
	schema: {
		query: null,
		body: {
			properties: {
				totp: {
					type: 'string',
					minLength: 6,
					maxLength: 6
				},
				secret: {
					isBinary: true,
					minBytes: 20,
					maxBytes: 20
				}
			},
			additionalProperties: false,
			required: [
				'totp'
			]
		}
	},

	run: async function run (req, res, next) {
		if (!req.user || !req.user.isUser()) {
			return res.sendStatus(404);
		}

		if (req.session.totp) {
			const err = new Error('User is already logged in using TOTP');
			err.statusCode = 403;
			return next(err);
		}

		if (req.body.secret) { // Setup
			// Ensure totp hasn't already been set up
			const alreadyTotp = await AKSO.db.first(1).from('codeholders_totp').where({
				codeholderId: req.user.user
			});
			if (alreadyTotp) {
				const err = new Error('TOTP has already been set up');
				err.statusCode = 403;
				return next(err);
			}

			// Encrypt the secret
			const iv = await crypto.randomBytes(16);
			const cipher = crypto.createCipheriv('aes-256-cbc', AKSO.conf.totpAESKey, iv);
			const secretEncr = Buffer.concat([
				cipher.update(req.body.secret),
				cipher.final()
			]);

			// Save in db
			await AKSO.db('codeholders_totp').insert({
				codeholderId: req.user.user,
				secret: secretEncr,
				iv: iv
			});
		}

		// Login
		passport.authenticate('totp', (err, user) => {
			if (err) { return next(err); }
			if (!user) { return res.sendStatus(401); }

			req.logIn(user, err => {
				if (err) { return next(err); }

				req.session.totp = true;

				res.sendStatus(204);
			});
		})(req, res, next);
	}
};
