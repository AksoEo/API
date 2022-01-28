import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$countryCode } from './$countryCode';

import method$get from './get';

/**
 * Sets up /intermediaries
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:countryCode', route$$countryCode());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
