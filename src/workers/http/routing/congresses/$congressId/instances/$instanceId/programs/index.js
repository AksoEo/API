import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$programId } from './$programId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/programs
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:programId(\\d+)', route$$programId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
