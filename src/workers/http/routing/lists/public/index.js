import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$listId } from './$listId';

import method$get from './get';

/**
 * Sets up /lists/public
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:listId(\\d+)', route$$listId());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
