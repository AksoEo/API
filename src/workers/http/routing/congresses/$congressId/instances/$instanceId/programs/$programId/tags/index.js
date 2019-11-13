import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$tagId } from './$tagId';

import method$get from './get';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/programs/{programId}/tags
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:tagId(\\d+)', route$$tagId());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
