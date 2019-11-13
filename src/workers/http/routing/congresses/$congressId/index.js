import express from 'express';

import { bindMethod } from 'akso/workers/http/routing';

import { init as route$instances } from './instances';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

/**
 * Sets up /congresses/{congressId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/instances', route$instances());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
