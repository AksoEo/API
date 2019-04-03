import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { BasicStrategy } from 'passport-http';
import bcrypt from 'bcrypt';

import AuthClient from './lib/auth-client';

/**
 * Sets up authentication on Express
 * @param  {express.Application} app
 */
async function authentication (app) {
	// User-based authentication
	passport.use(new LocalStrategy({
		usernameField: 'login',
		passwordField: 'password'
	}, async function authenticateLocal (username, password, done) {
		const whereStmt = {
			enabled: 1
		};

		if (username.includes('@')) {
			whereStmt.email = username;
		} else if (username.length === 4) {
			whereStmt.oldCode = username;
		} else {
			whereStmt.newCode = username;
		}

		// Try to find the user
		const dbUser = await AKSO.db.first('id', 'password').from('codeholders').where(whereStmt);
		if (!dbUser) { return done(null, false); }

		if (!dbUser.password) {
			// TODO: Do something
			const err = new Error('User has no password');
			err.statusCode = 500;
			return done(err);
		}

		// Verify the password
		const validPass = await bcrypt.compare(password, dbUser.password);
		if (!validPass) { return done(null, false); }

		const user = new AuthClient(dbUser.id, null);
		return done(null, user);
	}));

	passport.serializeUser((client, done) => {
		if (client.user) { return done(null, client.user); }

		done(null, -1);
	});

	passport.deserializeUser(async (id, done) => {
		const dbUser = await AKSO.db.first(1).from('codeholders').where('id', id);
		if (!dbUser) {
			const err = new Error('Invalid session');
			err.statusCode = 400;
			return done(err);
		}
		done(null, new AuthClient(id, null));
	});

	// Application authentication
	passport.use(new BasicStrategy({ passReqToCallback: true }, async function authenticateHttp (req, apiKey, apiSecret, done) {
		if (req.user) {
			const err = new Error('Already authenticated');
			err.statusCode = 400;
			return done(err);
		}

		const apiKeyBuf = Buffer.from(apiKey, 'hex'); // returns an empty buffer if invalid hex
		const secretHashed = crypto.createHash('sha256').update(apiSecret).digest();

		// Try to find the client
		const dbClient = await AKSO.db.first(1).from('clients').where({
			apiKey: apiKeyBuf,
			apiSecret: secretHashed
		});
		if (!dbClient) { return done(null, false); }

		const client = new AuthClient(null, apiKeyBuf);
		return done(null, client);
	}));

	app.use(passport.initialize());
	app.use(passport.session());
	
	// Perform app auth
	app.use(function checkAppAuthUsed (req, res, next) {
		if (!req.headers['authorization']) { return next(); }
		
		passport.authenticate('basic', { session: false }, (err, user, info) => {
			if (err) { return next(err); }
			if (!user) { return res.sendStatus(401); }
			req.logIn(user, { session: false }, err => {
				if (err) { return next(err); }
				next();
			});
		})(req, res, next);
	});
}

export default authentication;
