import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import operation$create_new_secret from './!create_new_secret';

/**
 * Sets up /clients/self
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use((req, res, next) => { // eslint-disable-line no-unused-vars
		if (!req.user || !req.user.isApp()) {
			return res.sendStatus(404);
		}
		next();
	});

	bindMethod(router, '/!create_new_secret', 'post', operation$create_new_secret);

	return router;
}
