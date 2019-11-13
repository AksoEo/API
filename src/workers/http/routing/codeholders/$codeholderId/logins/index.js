import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$loginId } from './$loginId';

import method$get from './get';

/**
 * Sets up /codeholders/{codeholderId}/logins
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:loginId(\\d+)', route$$loginId());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
