import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$voters } from './voters';

import method$get from './get';

/**
 * Sets up /votes/{voteId}/stats
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/voters', route$voters());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
