import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$codeholders } from './codeholders';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

/**
 * Sets up /lists/{listId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/codeholders', route$codeholders());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
