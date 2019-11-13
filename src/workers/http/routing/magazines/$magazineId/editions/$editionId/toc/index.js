import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$tocEntryId } from './$tocEntryId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /magazines/{magazineId}/editions/{editionId}/toc
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:tocEntryId(\\d+)', route$$tocEntryId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
