import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$membershipId } from './$membershipId';

import method$get from './get';

/**
 * Sets up /codeholders/self/membership
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:membershipId(\\d+)', route$$membershipId());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
