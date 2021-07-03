import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$changeRequestId } from './$changeRequestId';

import method$get from './get';

/**
 * Sets up /codeholders/change_requests
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:changeRequestId(\\d+)', route$$changeRequestId());

	bindMethod(router, '/', 'get', method$get);
	
	return router;
}
