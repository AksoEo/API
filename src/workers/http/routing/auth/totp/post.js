import crypto from 'pn/crypto';
import passport from 'passport';
import moment from 'moment-timezone';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
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
				},
				remember: {
					type: 'boolean',
					default: false
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
		passport.authenticate('totp', async (err, user) => {
			if (err) { return next(err); }
			if (!user) {
				// Invalid totp
				if (req.body.secret) {
					// Remove it from the db
					await AKSO.db('codeholders_totp')
						.where({
							codeholderId: req.user.user
						})
						.delete();
				}
				return res.sendStatus(401);
			}

			req.logIn(user, async err => {
				if (err) { return next(err); }

				req.session.totp = true;

				if (req.body.remember) {
					const rememberKey = await crypto.randomBytes(32);
					const rememberKeyHash = crypto.createHash('sha256').update(rememberKey).digest();

					const timeNow = moment().unix();
					const expiration = timeNow + AKSO.TOTP_REMEMBER_LIFE;

					await AKSO.db('codeholders_totp_remember').insert({
						rememberKey: rememberKeyHash,
						codeholderId: user.user,
						time: timeNow
					});

					res.cookie('remember_totp', rememberKey.toString('hex'), {
						expires: moment.unix(expiration).toDate(),
						httpOnly: true,
						sameSite: 'lax'
					});
				}

				res.sendStatus(204);
			});
		})(req, res, next);
	}
};
