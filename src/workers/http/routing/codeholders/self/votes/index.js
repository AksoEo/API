import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$voteId } from './$voteId';

import method$get from './get';

/**
 * Sets up /codeholders/self/votes
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:voteId(\\d+)', route$$voteId());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
