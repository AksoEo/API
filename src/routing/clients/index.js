import express from 'express';

import { bindMethod } from '..';

import { init as route$$apiKey } from './$apiKey';
import { init as route$self } from './self';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /clients
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/self', route$self());
	router.use('/:apiKey', route$$apiKey());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
