import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$countryCode } from './$countryCode';

import method$get from './get';

/**
 * Sets up /countries
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:countryCode([a-z]{2})', route$$countryCode());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
