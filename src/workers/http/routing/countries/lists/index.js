import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$listName } from './$listName';

import method$get from './get';

/**
 * Sets up /countries/lists
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:listName', route$$listName());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
