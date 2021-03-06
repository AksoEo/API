import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as router$logins } from './logins';
import { init as router$membership } from './membership';
import { init as router$profile_picture } from './profile_picture';
import { init as router$votes } from './votes';

import method$get from './get';

/**
 * Sets up /codeholders/self
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

	router.use('/logins', router$logins());
	router.use('/membership', router$membership());
	router.use('/profile_picture', router$profile_picture());
	router.use('/votes', router$votes());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
