import cluster from 'cluster';
import winston from 'winston';
import moment from 'moment-timezone';
import msgpack from 'msgpack-lite';
import path from 'path';
import fs from 'fs-extra';

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
				trustProxy:	process.env.AKSO_HTTP_TRUST_PROXY || false,
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
					'/' : process.env.AKSO.HTTP_PATH,
				threads: 			process.env.AKSO_HTTP_THREADS === undefined ?
					3 : parseInt(process.env.AKSO_HTTP_THREADS, 10)
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
			stateDir: process.env.AKSO_STATE_DIR,
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
			'X-Identifier',
			'Retry-After',
			'Content-Type',
			'Location'
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

		STRIPE_API_VERSION: '2020-03-02',

		// Constants used by internal APIs, not to be touched directly
		msgpack: msgpack.createCodec({
			int64: true
		}),
		db: null
	};

	if (cluster.isMaster) {
		AKSO.log.info('AKSO version %s', AKSO.version);
		AKSO.log.warn('Running in mode: %s', AKSO.conf.prodMode);
	}

	// Complain about missing/invalid env vars
	if (!Number.isSafeInteger(AKSO.conf.http.threads) || AKSO.conf.http.threads > 32 || AKSO.conf.http.threads < 1) {
		AKSO.log.error('AKSO_HTTP_THREADS must be an integer in the range 1-32');
		process.exit(1);
	}
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
	if (!AKSO.conf.stateDir) {
		AKSO.log.error('Missing AKSO_STATE_DIR');
		process.exit(1);
	} else if (!fs.statSync(AKSO.conf.stateDir).isDirectory()) {
		AKSO.log.error('AKSO_STATE_DIR must be a directory');
		process.exit(1);
	}

	if (cluster.isMaster) {
		// Set up subdirs in data dir
		AKSO.log.info('Setting up data dirs');
		await Promise.all([
			// State machines
			fs.ensureDir(path.join(AKSO.conf.stateDir, 'notifs_telegram')),
			fs.ensureDir(path.join(AKSO.conf.stateDir, 'notifs_mail')),
			fs.ensureDir(path.join(AKSO.conf.stateDir, 'address_label_orders')),

			// Resources
			fs.ensureDir(path.join(AKSO.conf.dataDir, 'codeholder_files')),
			fs.ensureDir(path.join(AKSO.conf.dataDir, 'codeholder_pictures')),
			fs.ensureDir(path.join(AKSO.conf.dataDir, 'magazine_edition_files')),
			fs.ensureDir(path.join(AKSO.conf.dataDir, 'magazine_edition_thumbnails')),
			fs.ensureDir(path.join(AKSO.conf.dataDir, 'magazine_edition_toc_recitation')),
			fs.ensureDir(path.join(AKSO.conf.dataDir, 'congress_instance_location_thumbnails'))
		]);
	}

	// Init
	moment.locale('eo');

	// Warn about used values
	if (cluster.isMaster) {
		if (!AKSO.conf.loginNotifsEnabled) {
			AKSO.log.warn('Login notifications disabled');
		}

		// http
		if (AKSO.conf.http.trustProxy) {
			AKSO.log.warn('Trusting proxy: ' + AKSO.conf.http.trustProxy);
		}
		if (!AKSO.conf.http.corsCheck) {
			AKSO.log.warn('Running without CORS check');
		}
		if (!AKSO.conf.http.helmet) {
			AKSO.log.warn('Running without helmet');
		}
		if (!AKSO.conf.http.csrfCheck) {
			AKSO.log.warn('CSRF check disabled');
		}
		if (!AKSO.conf.http.rateLimit) {
			AKSO.log.warn('Running without rate limit');
		}
	}

	// Load shared modules
	await AKSODb.init();

	// Set up cluster
	if (cluster.isMaster) {
		const workers = {};
		const workerPromises = {};
		const summonWorker = function (type, num = 1) {
			const worker = cluster.fork({ aksoClusterType: type, aksoClusterNum: num });
			const id = `${type}-${num}`;
			workers[id] = worker;
			workerPromises[id] = new Promise(resolve => {
				// Await ready
				worker.on('message', msg => {
					if (msg !== 'ready') { return; }
					resolve();
				});
			});
			// Cope with death
			worker.on('exit', code => {
				if (code !== 0) {
					AKSO.log.error(`${type} worker #${num} died with non-zero exit code, killing AKSO`);
					process.exit(code);
				}
				AKSO.log.info(`${type} worker #${num} died for unknown reasons, cloning its DNA ...`);
				summonWorker(type);
			});
		};

		summonWorker('mail');
		summonWorker('telegram');
		summonWorker('labels');
		summonWorker('timers');
		for (let i = 1; i <= AKSO.conf.http.threads; i++) {
			summonWorker('http', i);
		}

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

		AKSO.log.info('AKSO master is ready (workers still loading)');

		await Promise.all(Object.values(workerPromises));
		setTimeout(function () {
			AKSO.log.info('All workers are ready');
		}, 100); // We do this on a timeout to let the last worker log first
	} else {
		switch (process.env.aksoClusterType) {
		case 'http':
			const AKSOHttp = require('./workers/http');
			await AKSOHttp.init();
			break;
		case 'mail':
			const AKSOMail = require('./workers/mail');
			await AKSOMail.init();
			break;
		case 'telegram':
			const AKSOTelegram = require('./workers/telegram');
			await AKSOTelegram.init();
			break;
		case 'labels':
			const AKSOLabels = require('./workers/labels');
			await AKSOLabels.init();
			break;
		case 'timers':
			const AKSOTimers = require('./workers/timers');
			await AKSOTimers.init();
			break;
		default:
			AKSO.log.error(`Unknown cluster type ${process.env.aksoClusterType}, exiting`);
			process.exit(1);
		}
		process.send('ready');
		AKSO.log.info(`${process.env.aksoClusterType} worker #${process.env.aksoClusterNum} is ready`);
	}
}

init().catch(err => {
	console.log(err); // eslint-disable-line no-console
	process.exit(1);
});
