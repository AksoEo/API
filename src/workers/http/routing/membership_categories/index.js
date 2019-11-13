import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$categoryId } from './$categoryId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /membership_categories
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:categoryId(\\d+)', route$$categoryId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
