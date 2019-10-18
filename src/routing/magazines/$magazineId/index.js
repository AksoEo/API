import express from 'express';

import { bindMethod } from '../..';

import { init as route$editions } from './editions';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

/**
 * Sets up /magazines/{magazineId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/editions', route$editions());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
