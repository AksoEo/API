import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$countryCode } from './$countryCode';
import { init as route$lists } from './lists';

import method$get from './get';

/**
 * Sets up /countries
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:countryCode([a-z]{2})', route$$countryCode());
	router.use('/lists', route$lists());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
