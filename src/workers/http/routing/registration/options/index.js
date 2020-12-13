import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$year } from './$year';

import method$get from './get';

/**
 * Sets up /registration/options
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:year(\\d{4})', route$$year());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
