import passport from 'passport';
import geoip from 'geoip-lite';
import useragent from 'useragent';
import moment from 'moment-timezone';
import ipaddr from 'ipaddr.js';
import crypto from 'pn/crypto';
import * as latlon from 'latlon-formatter';

import * as AKSONotif from 'akso/notif';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				login: {
					type: 'string',
					oneOf: [
						{
							format: 'email'
						},
						{
							pattern: '^[a-z]{4}([a-z\\-][a-z])?$'
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
		// if password evals to false, passport just pretends the user doesn't exist
		// in reality they might just not have set up a password
		// this hack bypasses that
		if (!req.body.password.length) { req.body.password = 42; }

		passport.authenticate('local', (err, user) => {
			if (err) { return next(err); }
			if (!user) { return res.sendStatus(401); }
			req.logIn(user, { keepSessionInfo: false }, async err => {
				if (err) { return next(err); }

				// Check if there's a totp remember key set
				if (req.cookies.remember_totp) {
					// Look it up
					const rememberKey = Buffer.from(req.cookies.remember_totp, 'hex');
					const rememberKeyHash = crypto.createHash('sha256').update(rememberKey).digest();

					const timeNow = moment().unix();
					const found = await AKSO.db('codeholders_totp_remember')
						.where({
							rememberKey: rememberKeyHash,
							codeholderId: user.user
						})
						.update('time', timeNow);

					if (found) {
						const expiration = timeNow + AKSO.TOTP_REMEMBER_LIFE;

						res.cookie('remember_totp', req.cookies.remember_totp, {
							expires: moment.unix(expiration).toDate(),
							httpOnly: true,
							sameSite: 'lax'
						});

						req.session.totp = true;
					} else {
						res.clearCookie('remember_totp');
					}
				}

				res.sendStatus(204);

				// Log the login to codeholders_logins
				const geoData = geoip.lookup(req.ip);

				const rawUserAgent = req.headers['user-agent'] || null;
				const userAgent = rawUserAgent ? useragent.lookup(rawUserAgent) : null;

				const ll = geoData ? geoData.ll : [ 0, 0 ]; // default to null island;

				const loginData = {
					codeholderId: user.user,
					time: moment().unix(),
					timezone: geoData ? geoData.timezone : 'UTC',
					ip: Buffer.from(ipaddr.parse(req.ip).toByteArray()),
					userAgent: rawUserAgent,
					userAgentParsed: userAgent.toString(),
					ll: AKSO.db.raw(`POINT(${ll[0]},${ll[1]})`),
					area: geoData ? geoData.area : 0,
					country: geoData ? geoData.country : null,
					region: geoData ? geoData.region : null,
					city: geoData ? geoData.city : null,
				};
				if (loginData.userAgent) {
					loginData.userAgent = loginData.userAgent.substring(0, 500);
					loginData.userAgentParsed = loginData.userAgentParsed.substring(0, 500);
				}


				// Check if the location seems fishy
				let isFishy = false;
				if (AKSO.conf.loginNotifsEnabled) {
					// Check if this is the first login ever
					const loginCount = (await AKSO.db('codeholders_logins')
						.count({ count: 1 })
						.where('codeholderId', user.user)
					)[0].count;

					if (loginCount > 0) {
						// Check if we've previously had a login from a similar location
						const similarLogin = await AKSO.db('codeholders_logins')
							.first(1)
							.where('codeholderId', user.user)
							.where(function() {
								this
									.where('ip', loginData.ip)
									.orWhere(function () {
										this
											.whereNotNull('country')
											.where({
												country: loginData.country,
												region: loginData.region
											});
									});
							});

						if (!similarLogin) { isFishy = true; }
					}
				}

				await AKSO.db('codeholders_logins').insert(loginData);

				if (AKSO.conf.loginNotifsEnabled && isFishy) {
					// Send an alert to the codeholder
					const countryData = await AKSO.db('countries')
						.where('code', loginData.country)
						.first('name_eo');

					const coordsOpts = {
						degrees: true
					};
					const coords = latlon.formatLatitude(ll[0], coordsOpts) + ', ' + latlon.formatLongitude(ll[1], coordsOpts);

					let region = loginData.region;
					if (AKSO.SUBDIVISIONS[loginData.country] && AKSO.SUBDIVISIONS[loginData.country][`${loginData.country}-${region}`]) {
						region = AKSO.SUBDIVISIONS[loginData.country][`${loginData.country}-${region}`].name;
					}

					let prettyIp = ipaddr.fromByteArray(loginData.ip).toString();
					prettyIp = ipaddr.process(prettyIp).toString();

					await AKSONotif.sendNotification({
						codeholderIds: [ user.user ],
						org: 'uea',
						notif: 'fishy-location',
						category: 'account',
						view: {
							time: moment.unix(loginData.time).tz(loginData.timezone).format('D[-a de] MMMM Y [je] HH:mm Z'),
							ip: prettyIp,
							userAgent: loginData.userAgentParsed,
							country: countryData ? countryData.name_eo : loginData.country,
							region: region,
							city: loginData.city,
							coords: coords
						}
					});
				}
			});
		})(req, res, next);
	}
};
