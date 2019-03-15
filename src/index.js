import winston from 'winston';
import moment from 'moment';

import AKSOMail from './mail';
import AKSOHttp from './http';

global.AKSO = {
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
			port: process.env.AKSO_HTTP_PORT || 1111
		},
		sendgrid: {
			apiKey: process.env.AKSO_SENDGRID_API_KEY
		}
	},

	// Constants used by internal APIs, not to be touched directly
	mail: null
};

// Complain about missing required env vars
if (!AKSO.conf.sendgrid.apiKey) {
	AKSO.log.error('Missing AKSO_SENDGRID_API_KEY');
	process.exit(1);
}

// Init
moment.locale('en');

AKSO.log.info("AKSO version %s", AKSO.version);

AKSOMail();
AKSOHttp();

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
