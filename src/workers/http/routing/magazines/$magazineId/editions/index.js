import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$editionId } from './$editionId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /magazines/{magazineId}/editions
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/:editionId(\\d+)', route$$editionId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
