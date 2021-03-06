import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$codeholders } from './codeholders';

import method$get from './get';

/**
 * Sets up /lists/public/{listId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/codeholders', route$codeholders());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
