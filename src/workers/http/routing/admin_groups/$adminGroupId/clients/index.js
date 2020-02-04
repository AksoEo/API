import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$apiKey } from './$apiKey';

import method$get from './get';

/**
 * Sets up /admin_groups/{adminGroupId}/clients
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.param('apiKey', (req, res, next, val) => {
		req.params.apiKey = Buffer.from(val, 'hex');
		next();
	});
	router.use('/:apiKey', route$$apiKey());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
