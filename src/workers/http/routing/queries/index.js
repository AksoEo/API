import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$id } from './$id';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /queries
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:id(\\d+)', route$$id());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
