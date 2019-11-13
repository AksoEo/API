import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$ballot } from './ballot';
import { init as route$result } from './result';

import method$get from './get';

/**
 * Sets up /codeholders/self/votes/{voteId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/ballot', route$ballot());
	router.use('/result', route$result());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
