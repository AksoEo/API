import passport from 'passport';
import geoip from 'geoip-lite';
import useragent from 'useragent';
import moment from 'moment';
import ipaddr from 'ipaddr.js';

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

				const loginData = {
					codeholderId: user.user,
					time: moment().unix(),
					timezone: geoData ? geoData.timezone : 'UTC',
					ip: Buffer.from(ipaddr.parse(req.ip).toByteArray()),
					userAgent: rawUserAgent,
					userAgentParsed: userAgent.toString(),
					ll: geoData ? geoData.ll : [ 0, 0 ], // default to null island
					area: geoData ? geoData.area : 0,
					country: geoData ? geoData.country : null,
					region: geoData ? geoData.region : null,
					city: geoData ? geoData.city : null,
				};
				loginData.ll = AKSO.db.raw(`POINT(${loginData.ll[0]},${loginData.ll[1]})`);

				await AKSO.db('codeholders_logins').insert(loginData);
			});
		})(req, res, next);
	}
};
