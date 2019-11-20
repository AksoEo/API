import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /lists
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
