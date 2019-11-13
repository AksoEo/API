import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$fileId } from './$fileId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /codeholders/{codeholderId}/files
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:fileId(\\d+)', route$$fileId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
