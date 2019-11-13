import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$locationId } from './$locationId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/locations
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });
	
	router.use('/:locationId(\\d+)', route$$locationId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
