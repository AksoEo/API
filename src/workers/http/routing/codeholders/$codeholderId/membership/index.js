import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$membershipId } from './$membershipId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /codeholders/{codeholderId}/membership
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:membershipId(\\d+)', route$$membershipId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
