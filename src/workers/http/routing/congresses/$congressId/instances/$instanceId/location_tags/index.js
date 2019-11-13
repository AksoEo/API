import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$tagId } from './$tagId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/location_tags
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:tagId(\\d+)', route$$tagId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
