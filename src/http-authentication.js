import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { BasicStrategy } from 'passport-http';
import { Strategy as TotpStrategy } from 'passport-totp';
import bcrypt from 'bcrypt';
import crypto from 'pn/crypto';

import AuthClient from './lib/auth-client';
import AKSOPermissions from './perms';

/**
 * Sets up authentication on Express
 * @param  {express.Application} app
 */
async function authentication (app) {
	// User-based authentication strategy
	passport.use(new LocalStrategy({
		usernameField: 'login',
		passwordField: 'password'
	}, async function authenticateLocal (username, password, done) {
		const whereStmt = {
			enabled: 1,
			isDead: 0
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
			const err = new Error('User has no password');
			err.statusCode = 409;
			return done(err);
		}

		if (typeof password !== 'string') {
			const err = new Error();
			err.statusCode = 401;
			return done(err);
		}

		// Verify the password
		const validPass = await bcrypt.compare(password, dbUser.password);
		if (!validPass) { return done(null, false); }

		const user = new AuthClient(dbUser.id, null);
		return done(null, user);
	}));

	// User-based totp authentication strategy
	passport.use(new TotpStrategy({
		codeField: 'totp'
	}, async function authenticateTotp (user, done) {
		// Obtain TOTP secret
		const totpData = await AKSO.db.first('secret', 'iv').from('codeholders_totp').where({
			codeholderId: user.user
		});
		if (!totpData) {
			const err = new Error('User has not set up TOTP');
			err.statusCode = 403;
			return done(err);
		}
		// Decrypt the TOTP secret
		const decipher = crypto.createDecipheriv('aes-256-cbc', AKSO.conf.totpAESKey, totpData.iv);
		const secret = Buffer.concat([
			decipher.update(totpData.secret),
			decipher.final()
		]);
		return done(null, secret, 30);
	}));

	// Session-based user serialization for user auth
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

	// Application authentication strategy
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

	// Set up passport
	app.use(passport.initialize());
	app.use(passport.session());
	
	// Perform app auth
	app.use(function checkAppAuthUsed (req, res, next) {
		if (!req.headers['authorization']) { return next(); }
		
		passport.authenticate('basic', { session: false }, (err, user) => {
			if (err) { return next(err); }
			if (!user) { return res.sendStatus(401); }
			req.logIn(user, { session: false }, err => {
				if (err) { return next(err); }
				next();
			});
		})(req, res, next);
	});

	// Set up permissions
	app.use(AKSOPermissions);
}

export default authentication;
