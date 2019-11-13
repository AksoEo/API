import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$roleId } from './$roleId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /codeholder_roles
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:roleId(\\d+)', route$$roleId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
