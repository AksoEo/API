import winston from 'winston';
import moment from 'moment-timezone';
import msgpack from 'msgpack-lite';
import path from 'path';
import fs from 'fs-extra';

import * as AKSOMail from './mail';
import * as AKSOTelegram from './telegram';
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
				trustLocalProxy:	process.env.AKSO_HTTP_TRUST_LOCAL_PROXY === undefined ?
					false : process.env.AKSO_HTTP_TRUST_LOCAL_PROXY != '0',
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
					true : process.env.AKSO_HTTP_DISABLE_SLOW_DOWN == '0',
				path:				process.env.AKSO_HTTP_PATH === undefined ?
					'/' : process.env.AKSO.HTTP_PATH
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
			telegram: {
				token: process.env.AKSO_TELEGRAM_TOKEN
			},
			prodMode: process.env.NODE_ENV || 'dev',
			totpAESKey: Buffer.from(process.env.AKSO_TOTP_AES_KEY || '', 'hex'),
			dataDir: process.env.AKSO_DATA_DIR,
			loginNotifsEnabled: process.env.AKSO_DISABLE_LOGIN_NOTIFS === undefined ?
				true : process.env.AKSO_DISABLE_LOGIN_NOTIFS == '0'
		},

		// Constants, do not change without updating docs
		CORS_ORIGIN_WHITELIST: [
			/^(.+\.)?akso\.org$/,
			'tejo.org',
			'uea.org'
		],
		CORS_ALLOWED_HEADERS: [
			'X-CSRF-Token',
			'X-Http-Method-Override',
			'Content-Type',
			'If-None-Match',
			'Cache-Control'
		],
		CORS_EXPOSED_HEADERS: [
			'X-Response-Time',
			'X-Total-Items',
			'X-Total-Items-No-Filter',
			'X-Affected-Items',
			'X-RateLimit-Limit',
			'X-RateLimit-Remaining',
			'Retry-After',
			'Content-Type'
		],
		RATE_LIMIT_WINDOW_MS: 3*60*1000, // 3 minutes
		RATE_LIMIT_MAX: 300, // 300 requests per window ms max
		SLOW_DOWN_WINDOW_MS: 1*60*1000, // 1 minute
		SLOW_DOWN_DELAY_AFTER: 5, // allow 5 requests per window ms, then ...
		SLOW_DOWN_DELAY_MS: 500, // add a n*500ms delay for each n'th request past `delay after`
		SLOW_DOWN_MAX_DELAY_MS: 2000, // maximum delay per request
		TOTP_REMEMBER_LIFE: 5184000, // 60 days

		CREATE_PASSWORD_FREQ: 3*60*60, // 3 hours
		PASSWORD_BCRYPT_SALT_ROUNDS: 12,

		CODEHOLDER_OWN_CHANGE_CMT: 'Memfarita ŝanĝo',

		// https://github.com/timshadel/subdivision-list
		SUBDIVISIONS: require('../data/subdivisions.json'),

		// Constants used by internal APIs, not to be touched directly
		mail: null,
		msgpack: msgpack.createCodec({
			int64: true
		}),
		db: null,
		telegram: null,
		telegramQueue: null
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
	if (!AKSO.conf.telegram.token) {
		AKSO.log.error('Missing AKSO_TELEGRAM_TOKEN');
		process.exit(1);
	}
	if (AKSO.conf.totpAESKey.length != 32) {
		AKSO.log.error('AKSO_TOTP_AES_KEY must be 32 bytes encoded in hex');
		process.exit(1);
	}
	if (!AKSO.conf.dataDir) {
		AKSO.log.error('Missing AKSO_DATA_DIR');
		process.exit(1);
	} else if (!fs.statSync(AKSO.conf.dataDir).isDirectory()) {
		AKSO.log.error('AKSO_DATA_DIR must be a directory');
		process.exit(1);
	}

	// Set up subdirs in data dir
	await fs.ensureDir(path.join(AKSO.conf.dataDir, 'codeholder_files'));
	await fs.ensureDir(path.join(AKSO.conf.dataDir, 'codeholder_pictures'));
	await fs.ensureDir(path.join(AKSO.conf.dataDir, 'magazine_edition_files'));
	await fs.ensureDir(path.join(AKSO.conf.dataDir, 'magazine_edition_thumbnails'));
	await fs.ensureDir(path.join(AKSO.conf.dataDir, 'magazine_edition_toc_recitation'));

	// Init
	moment.locale('eo');

	AKSO.log.info('AKSO version %s', AKSO.version);
	AKSO.log.warn('Running in mode: %s', AKSO.conf.prodMode);

	// Warn about used values
	if (!AKSO.conf.loginNotifsEnabled) {
		AKSO.log.warn('Login notifications disabled');
	}

	await AKSODb.init();
	await AKSOMail.init();
	await AKSOTelegram.init();
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
	console.log(err); // eslint-disable-line no-console
	process.exit(1);
});
