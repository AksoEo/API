import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$$voteId } from './$voteId';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /votes
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	router.use('/:voteId(\\d+)', route$$voteId());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}
