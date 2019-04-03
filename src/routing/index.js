import express from 'express';
import Ajv from 'ajv';

import { init as route$auth } from './auth';

const ajv = new Ajv({
	format: 'full',
	useDefaults: true,
	strictKeywords: true
});
ajv.addKeyword('isBinary', {
	modifying: true,
	validate: function (schema, data, parentSchema, dataPath, parentData, propertyName) {
		if (!schema) { return true; }

		if (typeof data === 'string') {
			parentData[propertyName] = Buffer.from(data, 'base64');
			return true;

		} else if (data instanceof Buffer) {
			return true;
		}

		return false;
	}
});
ajv.addKeyword('minBytes', {
	validate: function (schema, data) {
		const buf = Buffer.from(data);
		return buf.length >= schema;
	}
});
ajv.addKeyword('maxBytes', {
	validate: function (schema, data) {
		const buf = Buffer.from(data);
		return buf.length <= schema;
	}
});

/**
 * Sets up all http routing
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.get('/', (req, res, next) => {
		res.type('text/plain').send([
			'AKSO REST Server',
			`Version: ${AKSO.version}`
			].join('\n'));
	});

	router.use('/auth', route$auth());

	return router;
}

/**
 * Wraps an async function to ensure proper error handling in Express
 * @param  {Function} fn
 * @return {Function}
 */
export function wrap (fn) {
	return (req, res, next) => {
		const promise = fn(req, res, next);
		if (promise.catch) {
			promise.catch(err => next(err));
		}
	};
}

/**
 * Binds a method to a router with built-in schema validation
 * @param  {express.Router} router The router to bind the endpoint to
 * @param  {string}         path   The path of the endpoint relative to the router
 * @param  {string}         method The method of the endpoint
 * @param  {Object}         bind   The bind object
 */
export function bindMethod (router, path, method, bind) {
	let validateBody = null;
	if (bind.schema && bind.schema.body) {
		validateBody = ajv.compile(bind.schema.body);
	}

	router[method](path, function validate (req, res, next) {
		if (bind.schema) {
			/**
			 * query:	null for none allowed
			 * body:	null for none allowed,
			 * 			Object for JSON schema validation
			 */

			if ('query' in bind.schema) {
				if (!bind.schema.query && Object.keys(req.query).length) {
					const err = new Error('Endpoint expects no query params');
					err.statusCode = 400;
					return next(err);
				}
			}

			if ('body' in bind.schema) {
				if (!bind.schema.body) {
					if (req.body instanceof Buffer && req.body.length || Object.keys(req.body).length) {
						const err = new Error('Endpoint expects no body');
						err.statusCode = 400;
						return next(err);
					}
				} else {
					if (!validateBody(req.body)) {
						res.status(400).sendObj(validateBody.errors);
						return;
					}
				}
			}
		}

		next();

	}, wrap(bind.run));
}
