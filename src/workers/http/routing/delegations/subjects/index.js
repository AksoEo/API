import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$subjectId } from './$subjectId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /delegations/subjects
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:subjectId(\\d+)', route$$subjectId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
