import winston from 'winston';
import moment from 'moment';
import msgpack from 'msgpack-lite';
import path from 'path';

import * as AKSOMail from './mail';
import * as AKSOHttp from './http';
import * as AKSODb from './db';

async function init () {
	global.AKSO = {
		dir: path.normalize(path.join(__dirname, '../')),

		version: require('../package.json').version,

		log: winston.createLogger({
			level: 'info',
			format: winston.format.combine(
				winston.format.splat(),
				winston.format.colorize(),
				winston.format.timestamp({
					format: () => moment().format('YYYY-MM-DD HH:mm:ss:SSS [Z]')
				}),
				winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
			),
			transports: [ new winston.transports.Console() ]
		}),

		conf: {
			http: {
				port: 				process.env.AKSO_HTTP_PORT || 1111,
				trustLocalProxy:	process.env.AKSO_HTTP_TRUST_LOCAL_PROXY || false,
				helmet:				process.env.AKSO_HTTP_USE_HELMET === undefined ?
					true : process.env.AKSO_HTTP_USE_HELMET != '0',
				sessionSecret:		process.env.AKSO_HTTP_SESSION_SECRET,
				corsCheck: 			process.env.AKSO_HTTP_DISABLE_CORS_CHECK === undefined ?
					true : process.env.AKSO_HTTP_DISABLE_CORS_CHECK == '0',
				csrfCheck: 			process.env.AKSO_HTTP_DISABLE_CSRF_CHECK === undefined ?
					true : process.env.AKSO_HTTP_DISABLE_CSRF_CHECK == '0',
				rateLimit:			process.env.AKSO_HTTP_DISABLE_RATE_LIMIT === undefined ?
					true : process.env.AKSO_HTTP_DISABLE_RATE_LIMIT == '0',
				loginSlowDown:		process.env.AKSO_HTTP_DISABLE_SLOW_DOWN === undefined ?
					true : process.env.AKSO_HTTP_DISABLE_SLOW_DOWN == '0'
			},
			mysql: {
				host: process.env.AKSO_MYSQL_HOST,
				user: process.env.AKSO_MYSQL_USER,
				password: process.env.AKSO_MYSQL_PASSWORD,
				database: process.env.AKSO_MYSQL_DATABASE
			},
			sendgrid: {
				apiKey: process.env.AKSO_SENDGRID_API_KEY
			},
			prodMode: process.env.NODE_ENV || 'dev',
			totpAESKey: Buffer.from(process.env.AKSO_TOTP_AES_KEY || '', 'hex')
		},

		// Constants, do not change without updating docs
		CORS_ORIGIN_WHITELIST: [
			/^.+\.akso\.org$/,
			'tejo.org',
			'uea.org'
		],
		CORS_ALLOWED_HEADERS: [
			'X-CSRF-Token',
			'X-Http-Method-Override'
		],
		CORS_EXPOSED_HEADERS: [
			'X-Response-Time',
			'X-Total-Items',
			'X-Total-Items-No-Filter',
			'X-Affected-Items',
			'X-RateLimit-Limit',
			'X-RateLimit-Remaining',
			'Retry-After'
		],
		RATE_LIMIT_WINDOW_MS: 3*60*1000, // 3 minutes
		RATE_LIMIT_MAX: 300, // 300 requests per window ms max
		SLOW_DOWN_WINDOW_MS: 1*60*1000, // 1 minute
		SLOW_DOWN_DELAY_AFTER: 5, // allow 5 requests per window ms, then ...
		SLOW_DOWN_DELAY_MS: 500, // add a n*500ms delay for each n'th request past `delay after`
		SLOW_DOWN_MAX_DELAY_MS: 2000, // maximum delay per request

		CREATE_PASSWORD_FREQ: 3*60*60, // 3 hours

		// Constants used by internal APIs, not to be touched directly
		mail: null,
		msgpack: msgpack.createCodec({
			int64: true
		}),
		db: null
	};

	// Complain about missing/invalid env vars
	if (!AKSO.conf.sendgrid.apiKey) {
		AKSO.log.error('Missing AKSO_SENDGRID_API_KEY');
		process.exit(1);
	}
	if (!AKSO.conf.http.sessionSecret) {
		AKSO.log.error('Missing AKSO_HTTP_SESSION_SECRET');
		process.exit(1);
	}
	if (AKSO.conf.totpAESKey.length != 32) {
		AKSO.log.error('AKSO_TOTP_AES_KEY must be 32 bytes encoded in hex');
		process.exit(1);
	}

	// Init
	moment.locale('en');

	AKSO.log.info('AKSO version %s', AKSO.version);
	AKSO.log.warn('Running in mode: %s', AKSO.conf.prodMode);

	await AKSODb.init();
	await AKSOMail.init();
	await AKSOHttp.init();

	AKSO.log.info('AKSO is ready');

	// Handle shutdown signal
	let shuttingDown = false;
	const performCleanup = function performCleanup (signal) {
		if (shuttingDown) { return; }
		shuttingDown = true;

		AKSO.log.info(`Received ${signal}, shutting down ...`);

		process.exit();
	};

	const shutdownTriggers = [ 'exit', 'SIGINT', 'SIGHUP', 'SIGTERM' ];
	for (let trigger of shutdownTriggers) {
		process.on(trigger, () => { performCleanup(trigger); });
	}
}

init().catch(err => {
	if (AKSO.log) {
		AKSO.log.error(err);
	} else {
		console.error(err); // eslint-disable-line no-console
	}
	process.exit(1);
});
