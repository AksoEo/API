import express from 'express';
import msgpack from 'msgpack-lite';
import moment from 'moment-timezone';
import Url from 'url';
import cookieParser from 'cookie-parser';
import session from 'cookie-session';
import helmet from 'helmet';
import methodOverride from 'method-override';
import bodyParser from 'body-parser';
import cors from 'cors';
import responseTime from 'response-time';
import csurf from '@dr.pogodin/csurf';
import ipaddr from 'ipaddr.js';
import rateLimit from 'express-rate-limit';
import useragent from 'useragent';

import { replaceObject, createTransaction, rollbackTransaction } from 'akso/util';

import { init as AKSORouting } from './routing';
import AKSOHttpAuthentication from './http-authentication';

export function init () {
	return new Promise((resolve, reject) => {
		(async () => {
			const app = express();

			// Set up response time calculation
			app.use(responseTime());

			if (AKSO.conf.http.trustProxy) {
				app.set('trust proxy', AKSO.conf.http.trustProxy);
			}

			// Set up CORS
			const corsSettings = {
				origin: (origin, cb) => cb(null, true), // setting it to * breaks credentials in fetch
				allowedHeaders: AKSO.CORS_ALLOWED_HEADERS,
				exposedHeaders: AKSO.CORS_EXPOSED_HEADERS,
				credentials: true
			};
			if (AKSO.conf.http.corsCheck) {
				corsSettings.origin = function cors (origin, cb) {
					if (!origin) { return cb(null, true); }

					let parsedUrl;
					try {
						parsedUrl = new URL(origin);
					} catch {
						const err = new Error('Invalid Origin header');
						err.statusCode = 400;
						throw err;
					}

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
							if (hostname === origin) {
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
			if (AKSO.conf.http.helmet) {
				app.use(helmet({
					xssFilter: false
				}));
			}
			app.use(cookieParser());
			app.use(session({
				secret: AKSO.conf.http.sessionSecret,
				name: 'akso_session',
				signed: true,
				sameSite: 'lax',
				overwrite: true,
				httpOnly: true,
			}));
			// FIXME: temp fix for broken compat between cookie-session and passport@0.6
			// from: https://github.com/jaredhanson/passport/issues/904#issuecomment-1307558283
			// Downgrading to passport@0.5 is not an option due to CVE-2022-25896 fixed in 0.6 which has not been backported
			// register regenerate & save after the cookieSession middleware initialization
			app.use(function(request, response, next) {
				if (request.session && !request.session.regenerate) {
					request.session.regenerate = cb => cb();
				}
				if (request.session && !request.session.save) {
					request.session.save = cb => cb();
				}
				next();
			});

			// Add custom methods to req and res
			app.use(setupMiddleware);

			// Parse body
			const saveRawBody = function saveRawBody (req, res, buf) {
				req.rawBody = buf;
			};

			app.use(bodyParser.json({
				limit: '1mb',
				verify: saveRawBody
			}));
			app.use(bodyParser.raw({
				type: 'application/vnd.msgpack',
				limit: '1mb',
				verify: saveRawBody
			}));
			// Allow application/x-www-form-urlencoded only for method overriding
			app.use(bodyParser.urlencoded({
				extended: false,
				limit: '4kb',
				verify: (req, res, buf) => {
					saveRawBody(req, res, buf);
					if (!req.headers['x-http-method-override'] || req.method !== 'POST') {
						const err = new Error('Unsupported media type');
						err.statusCode = 415;
						throw err;
					}
				}
			}));
			// Disallow all other content types
			app.use((req, res, next) => {
				if (!req.get('content-type')) { return next(); }

				if (!(
					req.is('application/json') ||
					req.is('application/vnd.msgpack') ||
					req.is('application/x-www-form-urlencoded') ||
					req.is('multipart/form-data')
				)) {
					const err = new Error('Unsupported media type');
					err.statusCode = 415;
					throw err;
				}

				next();
			});
			// Parse msgpack
			app.use(function (req, res, next) {
				if (!req.is('application/vnd.msgpack')) { return next(); }

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
			app.use(methodOverride((req, res, next) => { // eslint-disable-line no-unused-vars
				if (req.headers['x-http-method-override'] && req.body) {
					req.query = req.body;
					req.body = {};
				}

				return req.headers['x-http-method-override'];
			}));

			// Passport
			await AKSOHttpAuthentication(app);

			// CSRF
			if (AKSO.conf.http.csrfCheck) {
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

			// Save original query
			app.use((req, res, next) => {
				req.originalQuery = {...req.query};
				next();
			});

			// Rate limiting
			if (AKSO.conf.http.rateLimit) {
				app.use(rateLimit({
					windowMs: AKSO.RATE_LIMIT_WINDOW_MS,
					max: AKSO.RATE_LIMIT_MAX,
					message: 'Too many requests, please try again later',
					statusCode: 429,
					skip: function skipRateLimit (req) {
						return req.hasPermission('ratelimit.disable');
					},
					keyGenerator: function rateLimitKeyGenerator (req) {
						if (req.user) {
							if (req.user.isUser()) { return 'u:' + req.user.user; }
							else if (req.user.isApp()) { return 'a:' + req.user.app.toString('base64'); }
						}
						return req.ip;
					}
				}));
			}

			// Routing
			app.use('/', AKSORouting());

			// Error handling
			app.use(function handleError404 (req, res, next) { // eslint-disable-line no-unused-vars
				if (res.headersSent) { return; }
				res.sendStatus(404);
			});
			app.use(async function handleError500 (err, req, res, next) { // eslint-disable-line no-unused-vars
				const status = err.status || err.statusCode || 500;

				// Kill any incompleted transactions to ensure we release table locks
				if (req.transactions) {
					for (const trx of req.transactions) {
						if (trx.isCompleted()) { continue; }
						await rollbackTransaction(trx);
					}
				}

				if (err.name === 'KnexTimeoutError') {
					return res.status(400).type('text/plain')
						.send('TimeOut: The query you provided to ?filter took too long to execute, please try simplifying it.');
				}

				if (status >= 500) {
					const url = Url.parse(req.originalUrl).pathname;
					if (err.sqlState) { // It's from knex
						const error = err.sqlMessage ?? err.originalStack ?? err.stack ?? err;
						AKSO.log.error(
							`A SQL error occured at ${req.method} ${url}\n` +
							`${err.errno} ${err.code} [state ${err.sqlState}]\n` +
							error
						);
					} else {
						const error = err.stack ? err.stack : err;
						AKSO.log.error(`An error occured at ${req.method} ${url}\n${error}`);
					}
				}

				if (res.headersSent) { return; }
				if (status >= 500) {
					res.sendStatus(status);
				} else {
					if (err.message) {
						if (err.message === 'Invalid session') {
							await new Promise((resolve, reject) => {
								req.logOut({ keepSessionInfo: false }, err => {
									if (err) { reject(err); }
									else { resolve(); }
								});
							});
							req.session = null;
						}

						res.status(status).type('text/plain').send(err.message);
					} else {
						res.sendStatus(status);
					}
				}
			});

			app.listen(AKSO.conf.http.port, () => {
				resolve();
			});
		})().catch(reject);
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
				obj = replaceObject(obj, obj => {
					if (obj instanceof Buffer) {
						obj = obj.toString('base64');
					}
					return obj;
				});
				res.json(obj);
			},

			'application/vnd.msgpack': function () {
				// msgpack-lite doesn't call Object.prototype.toJSON by itself so we have to
				obj = replaceObject(obj, obj => {
					if (obj instanceof Buffer) { return undefined; }
					if (obj != null && typeof obj.toJSON === 'function') { return obj.toJSON(); }
					return obj;
				}, false);
				const data = msgpack.encode(obj, { codec: AKSO.msgpack });
				res.send(data);
			},

			default: function () {
				res.sendStatus(406);
			}
		});
	};

	// Creates a transaction that can automatically roll back when the request is completed if it has not been committed
	req.transactions = [];
	req.createTransaction = async function createReqTransaction (rollbackOnResFinish = true, db = AKSO.db) {
		const trx = await createTransaction(db);
		req.transactions.push(trx); // if a 5xx occurs, this array is iterated over to roll back all locks
		// This should only ever be false when the transaction is expected to finish after res.send
		if (rollbackOnResFinish) {
			res.on('finish', async () => {
				if (trx.isCompleted()) { return; }
				await rollbackTransaction(trx);
			});
		}
		return trx;
	};

	// Log to http log
	res.on('finish', async () => {
		try {
			if (req.method === 'OPTIONS') { return; }

			// Log the request
			const rawUserAgent = req.headers['user-agent'] || null;
			const userAgent = rawUserAgent ? useragent.lookup(rawUserAgent) : null;

			const logData = {
				time: moment().unix(),
				codeholderId: req.user ? req.user.user || null : null,
				apiKey: req.user ? req.user.app || null : null,
				ip: Buffer.from(ipaddr.parse(req.ip).toByteArray()),
				origin: req.get('origin') || req.get('host') || null,
				userAgent: rawUserAgent,
				userAgentParsed: userAgent ? userAgent.toString() : null,
				method: req.method,
				path: Url.parse(req.originalUrl).pathname,
				query: JSON.stringify(req.originalQuery) || '{}',
				resStatus: res.statusCode,
				resTime: res.get('x-response-time').slice(0, -2),
				resLocation: res.get('location') || null
			};

			// max length
			if (logData.origin) { logData.origin = logData.origin.substring(0, 300); }
			if (typeof logData.userAgent === 'string') {
				logData.userAgent = logData.userAgent.substring(0, 500);
			}
			if (typeof logData.userAgentParsed === 'string') {
				logData.userAgentParsed = logData.userAgentParsed.substring(0, 500);
			}
			logData.path = logData.path.substring(0, 300);
			if (parseInt(logData.resTime, 10) >= 10**6) {
				logData.resTime = '999999.999';
			}


			await AKSO.db('httpLog').insert(logData);
		} catch (e) {
			AKSO.log.error('An error occured while logging to httpLog');
			AKSO.log.error(e);
		}
	});

	next();
}
