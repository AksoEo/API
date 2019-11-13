import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$magazineId } from './$magazineId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /magazines
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:magazineId(\\d+)', route$$magazineId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
