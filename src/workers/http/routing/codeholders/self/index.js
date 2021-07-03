import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$logins } from './logins';
import { init as route$membership } from './membership';
import { init as route$profile_picture } from './profile_picture';
import { init as route$votes } from './votes';

import method$get from './get';
import method$patch from './patch';

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

	router.use('/logins', route$logins());
	router.use('/membership', route$membership());
	router.use('/profile_picture', route$profile_picture());
	router.use('/votes', route$votes());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
