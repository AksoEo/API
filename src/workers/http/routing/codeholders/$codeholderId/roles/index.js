import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$roleEntryId } from './$roleEntryId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /codeholders/{codeholderId}/roles
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:roleEntryId(\\d+)', route$$roleEntryId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
