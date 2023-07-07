import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import method$get from './get';
import method$put from './put';

/**
 * Sets up /tokens
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'put', method$put);

	return router;
}
