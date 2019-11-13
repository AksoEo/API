import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$adminGroupId } from './$adminGroupId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /admin_groups
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:adminGroupId(\\d+)', route$$adminGroupId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
