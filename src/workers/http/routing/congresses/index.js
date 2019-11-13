import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$congressId } from './$congressId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /congresses
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:congressId(\\d+)', route$$congressId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
