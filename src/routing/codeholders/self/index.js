import express from 'express';

import { bindMethod } from '../..';

import { init as router$profile_picture } from './profile_picture';

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

	router.use('/profile_picture', router$profile_picture());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
