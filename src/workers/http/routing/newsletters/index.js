import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$newsletterId } from './$newsletterId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /newsletters
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:newsletterId(\\d+)', route$$newsletterId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
