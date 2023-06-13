import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import routeMethod$worker_queues$get from './worker_queues';

/**
 * Sets up /status
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	bindMethod(router, '/worker_queues', 'get', routeMethod$worker_queues$get);

	return router;
}
