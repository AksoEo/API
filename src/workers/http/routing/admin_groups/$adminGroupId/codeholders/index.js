import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$codeholderId } from './$codeholderId';

import method$get from './get';

/**
 * Sets up /admin_groups/{adminGroupId}/codeholders
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:codeholderId(\\d+)', route$$codeholderId());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
