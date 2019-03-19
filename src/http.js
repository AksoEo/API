import express from 'express';
import msgpack from 'msgpack-lite';
import moment from 'moment';
import url from 'url';
import cookieParser from 'cookie-parser';
import session from 'cookie-session';
import helmet from 'helmet';
import methodOverride from 'method-override';
import bodyParser from 'body-parser';

import AKSORouting from './routing';

export default function init () {
	const app = express();

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
	// Allow text/plain only for method overriding
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
		verify: () => {
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
	app.use(methodOverride((req, res) => {
		if (req.body) {
			req.query = req.body;
			req.body = undefined;
		}

		return req.headers['x-http-method-override'];
	}));

	// Routing
	app.use('/', AKSORouting());

	// Error handling
	app.use(function handleError404 (req, res, next) {
		if (res.headersSent) { return; }
		res.sendStatus(404);
	});
	app.use(function handleError500 (err, req, res, next) {
		const status = err.status || err.statusCode;

		if (!status || status >= 500) {
			AKSO.log.error(`An error occured at ${req.method} ${req.originalUrl}\n${err.stack}`);
		}

		if (res.headersSent) { return; }
		res.sendStatus(err.statusCode || 500);
	});

	app.listen(AKSO.conf.http.port, () => {
		AKSO.log.info(`HTTP server listening on :${AKSO.conf.http.port}`);
	});
};

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

	res.on('finish', () => {
		// Log the request
		const logData = {
			time: moment().unix(),
			user: undefined, // todo
			app: undefined, // todo
			ip: req.ip,
			origin: req.get('origin') || req.get('host'),
			userAgent: req.headers['user-agent'] || null,
			method: req.method,
			path: url.parse(req.url).pathname,
			query: JSON.stringify(req.query),
			resStatus: res.statusCode
		};

		// console.log(logData); // todo
	});

	next();
}
