import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$instanceId } from './$instanceId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /congresses/{congressId}/instances
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:instanceId(\\d+)', route$$instanceId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
