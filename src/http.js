import express from 'express';
import msgpack from 'msgpack-lite';
import moment from 'moment';
import url from 'url';
import cookieParser from 'cookie-parser';
import session from 'cookie-session';
import helmet from 'helmet';
import methodOverride from 'method-override';
import bodyParser from 'body-parser';
import cors from 'cors';
import responseTime from 'response-time';
import csurf from 'csurf';

import { init as AKSORouting } from './routing';
import AKSOHttpAuthentication from './http-authentication';

export function init () {
	return new Promise(resolve => {
		(async () => {
			AKSO.log.info('Setting up http server ...');

			const app = express();

			// Set up response time calculation
			app.use(responseTime());

			// Set up CORS
			const corsSettings = {
				origin: '*',
				allowedHeaders: AKSO.CORS_ALLOWED_HEADERS,
				exposedHeaders: AKSO.CORS_EXPOSED_HEADERS,
				credentials: true
			};
			if (!AKSO.conf.http.corsCheck) {
				AKSO.log.warn('Running without CORS check');
			} else {
				corsSettings.origin = function cors (origin, cb) {
					if (!origin) { return cb(null, true); }

					const parsedUrl = url.parse(origin);

					// Validate protocol
					if (parsedUrl.protocol !== 'https:') {
						const err = new Error('Forbidden CORS protocol (only https is allowed)');
						err.statusCode = 403;
						throw err;
					}

					// Validate hostname
					let foundValidHostname = false;
					for (let hostname of AKSO.CORS_ORIGIN_WHITELIST) {
						if (typeof hostname === 'string') {
							if (parsedUrl.hostname === origin) {
								foundValidHostname = true;
								break;
							}
						} else if (hostname.test(origin)) {
							foundValidHostname = true;
							break;
						}
					}
					if (!foundValidHostname) {
						const err = new Error('Forbidden CORS hostname');
						err.statusCode = 403;
						throw err;
					}

					return cb(null, true);
				};
			}
			app.use(cors(corsSettings));

			// Add middleware
			if (AKSO.conf.trustLocalProxy) {
				app.set('trust proxy', 'loopback');
			}
			if (AKSO.conf.http.helmet) {
				app.use(helmet());
			} else {
				AKSO.log.warn('Running without helmet');
			}
			app.use(cookieParser());
			app.use(session({
				secret: AKSO.conf.http.sessionSecret,
				name: 'akso_session'
			}));

			// Add custom methods to req and res
			app.use(setupMiddleware);

			// Parse body
			app.use(bodyParser.json({
				limit: '1mb'
			}));
			app.use(bodyParser.raw({
				type: 'application/vnd.msgpack',
				limit: '1mb'
			}));
			// Allow application/x-www-form-urlencoded only for method overriding
			app.use(bodyParser.urlencoded({
				extended: false,
				limit: '1mb',
				verify: req => {
					if (!req.headers['x-http-method-override'] || req.method !== 'POST') {
						const err = new Error('Unsupported media type');
						err.statusCode = 415;
						throw err;
					}
				}
			}));
			// Disallow all other content types
			app.use(bodyParser.raw({
				type: () => true,
				verify: (req, res, buf) => {
					// Content-Type is only required if a body is supplied
					if (buf.length === 0) {
						return;
					}

					const err = new Error('Unsupported media type');
					err.statusCode = 415;
					throw err;
				}
			}));
			// Parse msgpack
			app.use(function (req, res, next) {
				if (req.headers['content-type'] !== 'application/vnd.msgpack') {
					next();
					return;
				}

				try {
					req.body = msgpack.decode(req.body, { codec: AKSO.msgpack });
				} catch (err) {
					err.statusCode = 400;
					next(err);
					return;
				}
				next();
			});

			// Method overriding
			app.use(methodOverride(req => {
				if (req.headers['x-http-method-override'] && req.body) {
					req.query = req.body;
					req.body = undefined;
				}

				return req.headers['x-http-method-override'];
			}));

			// Passport
			await AKSOHttpAuthentication(app);

			// CSRF
			if (!AKSO.conf.http.csrfCheck) {
				AKSO.log.warn('CSRF check disabled');
			} else {
				const csrf = csurf({
					cookie: false,
					ignoreMethods: [ 'GET', 'HEAD', 'OPTIONS' ],
					value: req => req.headers['x-csrf-token']
				});
				app.use(function csrfProtection (req, res, next) {
					if (req.user && req.user.isUser()) {
						csrf(req, res, next);
					} else {
						next();
					}
				});
			}

			// Routing
			app.use('/', AKSORouting());

			// Error handling
			app.use(function handleError404 (req, res) {
				if (res.headersSent) { return; }
				res.sendStatus(404);
			});
			app.use(function handleError500 (err, req, res) {
				const status = err.status || err.statusCode || 500;

				if (status >= 500) {
					AKSO.log.error(`An error occured at ${req.method} ${req.originalUrl}\n${err.stack}`);
				}

				if (res.headersSent) { return; }
				if (status >= 500) {
					res.sendStatus(status);
				} else {
					if (err.message) {
						res.status(status).type('text/plain').send(err.message);
					} else {
						res.sendStatus(status);
					}
				}
			});

			app.listen(AKSO.conf.http.port, () => {
				AKSO.log.info(`... HTTP server listening on :${AKSO.conf.http.port}`);
				resolve();
			});
		})();
	});
}

function setupMiddleware (req, res,  next) {
	/**
	 * Sends an object as response, formatting it according to the client's Accept http header
	 * @param  {[type]} obj The object to send
	 */
	res.sendObj = function resSendObj (obj) {
		res.format({
			'application/json': function () {
				res.json(obj);
			},

			'application/vnd.msgpack': function () {
				const data = msgpack.encode(obj, { codec: AKSO.msgpack });
				res.send(data);
			},

			default: function () {
				res.sendStatus(406);
			}
		});
	};

	res.on('finish', async () => {
		// Log the request
		const logData = {
			time: moment().unix(),
			codeholderId: req.user ? req.user.user || null : null,
			apiKey: req.user ? req.user.app || null : null,
			ip: req.ip,
			origin: req.get('origin') || req.get('host') || null,
			userAgent: req.headers['user-agent'] || null,
			method: req.method,
			path: url.parse(req.originalUrl).pathname,
			query: JSON.stringify(req.query),
			resStatus: res.statusCode,
			resTime: res.get('x-response-time').slice(0, -2)
		};

		// max length
		logData.origin = logData.origin.substring(0, 300);
		logData.userAgent = logData.userAgent.substring(0, 500);
		logData.path = logData.path.substring(0, 300);
		if (parseInt(logData.resTime, 10) >= 10**6) {
			logData.resTime = '999999.999';
		}

		if (logData.method === 'OPTIONS') { return; }

		await AKSO.db('httpLog').insert(logData);
	});

	next();
}
