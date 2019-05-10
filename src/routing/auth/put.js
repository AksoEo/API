import passport from 'passport';
import geoip from 'geoip-lite';
import useragent from 'useragent';
import moment from 'moment-timezone';
import ipaddr from 'ipaddr.js';
import * as latlon from 'latlon-formatter';

import * as AKSONotif from '../../notif';

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
		req.session = null; // this unsets totp data among other things

		passport.authenticate('local', (err, user) => {
			if (err) { return next(err); }
			if (!user) { return res.sendStatus(401); }
			req.logIn(user, async err => {
				if (err) { return next(err); }

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
							this.
								where('ip', loginData.ip)
								.orWhere(function () {
									this
										.whereNotNull('country')
										.where({
											country: loginData.country,
											region: loginData.region
										});
								})
								.orWhere(AKSO.db.raw('ST_Distance_Sphere(ll, ?) - area / 2 - ? < 200000', [ loginData.ll, loginData.area / 2 ]));
						});

					if (!similarLogin) { isFishy = true; }
				}

				await AKSO.db('codeholders_logins').insert(loginData);

				if (isFishy) {
					// Send an alert to the codeholder
					const countryData = await AKSO.db('countries')
						.where('code', loginData.country)
						.first('name_eo');

					const coordsOpts = {
						degrees: true
					};
					const coords = latlon.formatLatitude(ll[0], coordsOpts) + ', ' + latlon.formatLongitude(ll[1], coordsOpts);

					await AKSONotif.sendNotification({
						codeholderIds: [ user.user ],
						org: 'akso',
						notif: 'fishy-location',
						category: 'account',
						view: {
							time: moment.tz(loginData.time, loginData.timezone).format('D[-a de] MMMM Y [je] HH:mm Z'),
							ip: req.ip,
							userAgent: loginData.userAgentParsed,
							country: countryData ? countryData.name_eo : loginData.country,
							region: loginData.region,
							city: loginData.city,
							coords: coords
						}
					});
				}
			});
		})(req, res, next);
	}
};
