import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';
import method$put from './put';

/**
 * Sets up /codeholders/self/notif_prefs/global
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use((req, res, next) => { // eslint-disable-line no-unused-vars
		if (!req.user || !req.user.isUser()) {
			return res.sendStatus(404);
		}
		next();
	});

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'put', method$put);

	return router;
}
