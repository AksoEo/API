import express from 'express';
import msgpack from 'msgpack-lite';
import moment from 'moment';
import url from 'url';
import cookieParser from 'cookie-parser';
import session from 'cookie-session';
import helmet from 'helmet';

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
	app.use(function setupMiddleware (req, res,  next) {
		/**
		 * Sends an error message as response
		 * @param  {number} status The http status code
		 * @param  {string} err    The description
		 */
		res.sendError = function resSendError (status, err) {
			res.status(status).send({
				status: status,
				description: err.toString()
			});
		};

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
					res.sendError(406, 'Unacceptable');
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
				path: req.baseUrl,
				query: url.parse(req.url).query,
				resStatus: res.statusCode
			};

			console.log(logData); // todo
		});

		next();
	});

	// Routing
	app.use('/', AKSORouting());

	// Error handling
	app.use(function handleError404 (req, res, next) {
		if (res.headersSent) { return; }
		res.sendError(404, 'Not found');
	});
	app.use(function handleError500 (err, req, res, next) {
		AKSO.log.error(`An error occured at ${req.method} ${req.originalUrl}\n${err.stack}`);
		if (res.headersSent) { return; }
		res.sendError(500, 'Internal error');
	});

	app.listen(AKSO.conf.http.port, () => {
		AKSO.log.info(`HTTP server listening on :${AKSO.conf.http.port}`);
	});
};
