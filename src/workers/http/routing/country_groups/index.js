import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$group } from './$group';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /country_groups
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:group(x[a-z0-9]{2})', route$$group());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
