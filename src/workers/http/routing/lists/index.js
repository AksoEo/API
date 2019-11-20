import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$listId } from './$listId';
import { init as route$public } from './public';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /lists
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:listId(\\d+)', route$$listId());
	router.use('/public', route$public());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
