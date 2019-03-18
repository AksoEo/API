import express from 'express';
import msgpack from 'msgpack-lite';

import AKSORouting from './routing';

export default function init () {
	const app = express();

	// TODO: Middleware
	
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
		next();
	});

	// Routing
	app.use('/', AKSORouting());

	app.listen(AKSO.conf.http.port, () => {
		AKSO.log.info(`HTTP server listening on :${AKSO.conf.http.port}`);
	});
};
