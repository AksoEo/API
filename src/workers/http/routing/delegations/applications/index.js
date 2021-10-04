import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$applicationId } from './$applicationId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /delegations/applications
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:applicationId(\\d+)', route$$applicationId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
